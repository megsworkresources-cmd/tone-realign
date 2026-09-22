"use node";

/**
 * One-shot ops tooling: push the packaged source snapshot
 * (shiftedtone-source.zip) to GitHub without the git binary. Parses the zip,
 * then drives the GitHub REST API — create blobs (reusing identical ones),
 * build a tree (including deletions of stale paths), create a commit, and
 * fast-forward `main`.
 *
 * Auth model: the fine-grained GitHub token is supplied per-call by the
 * operator from the browser (/push-source page). It is used for the API calls
 * in this action, never written to the database, never logged, and should be
 * revoked on GitHub afterwards.
 *
 * Snapshot validation (secret-file refusal, package.json structure check,
 * entry filtering) lives in src/lib/source-guard.ts so it can be unit-tested
 * (src/lib/source-guard.test.ts).
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { gitBlobSha, validateSnapshot } from "../lib/source-guard";

const OWNER = "megsworkresources-cmd";
const REPO = "ShiftedTone";
const BRANCH = "main";

// The ops files themselves (githubPush.ts, PushSource.tsx) are included in
// the pushed source on purpose: they take the token per-call and contain no
// secrets, and excluding them would break the pushed repo's imports.

const BLOB_UPLOAD_CONCURRENCY = 8;

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function readU16LE(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8);
}
function readU32LE(b: Uint8Array, off: number): number {
  return (b[off] | (b[off + 1] << 8) | (b[off + 2] << 16) | (b[off + 3] << 24)) >>> 0;
}

/** Extract entries from a zip's central directory (stored + deflate). */
function parseZip(buf: Uint8Array): ZipEntry[] {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65557); i--) {
    if (readU32LE(buf, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip (no end-of-central-directory)");

  const total = readU16LE(buf, eocd + 10);
  let off = readU32LE(buf, eocd + 16);
  const entries: ZipEntry[] = [];

  for (let i = 0; i < total; i++) {
    if (readU32LE(buf, off) !== 0x02014b50) throw new Error("bad central directory");
    const method = readU16LE(buf, off + 10);
    const compSize = readU32LE(buf, off + 20);
    const nameLen = readU16LE(buf, off + 28);
    const extraLen = readU16LE(buf, off + 30);
    const commentLen = readU16LE(buf, off + 32);
    const localOff = readU32LE(buf, off + 42);
    const name = new TextDecoder().decode(buf.subarray(off + 46, off + 46 + nameLen));

    if (readU32LE(buf, localOff) !== 0x04034b50) throw new Error("bad local header");
    const lNameLen = readU16LE(buf, localOff + 26);
    const lExtraLen = readU16LE(buf, localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(dataStart, dataStart + compSize);

    if (method === 0) {
      entries.push({ name, data });
    } else if (method === 8) {
      entries.push({ name, data: inflateRaw(data) });
    } else {
      throw new Error(`unsupported compression method ${method} for ${name}`);
    }

    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Raw DEFLATE decoder (RFC 1951), pure JS — no zlib dependency in Convex. */
function inflateRaw(input: Uint8Array): Uint8Array {
  let pos = 0;
  let bitBuf = 0;
  let bitCnt = 0;
  const out: number[] = [];
  // 64 KB ring buffer = max DEFLATE window.
  const dict = new Uint8Array(65536);
  let dictPos = 0;

  const bit = (): number => {
    if (bitCnt === 0) {
      if (pos >= input.length) throw new Error("unexpected EOF in deflate stream");
      bitBuf = input[pos++];
      bitCnt = 8;
    }
    const b = bitBuf & 1;
    bitBuf >>>= 1;
    bitCnt--;
    return b;
  };
  const bits = (n: number): number => {
    let v = 0;
    for (let i = 0; i < n; i++) v |= bit() << i;
    return v;
  };
  const emit = (byte: number) => {
    out.push(byte);
    dict[dictPos] = byte;
    dictPos = (dictPos + 1) % dict.length;
  };
  const copyFromWindow = (dist: number, len: number) => {
    for (let i = 0; i < len; i++) {
      emit(dict[(dictPos - dist + dict.length * 2) % dict.length]);
    }
  };

  // Canonical Huffman: map "length:reversed-code" -> symbol. Codes arrive
  // LSB-first but are defined MSB-first, so bits are reversed at insert time.
  const makeDecoder = (lengths: number[]) => {
    const table = new Map<string, number>();
    const counts = new Array(16).fill(0);
    for (const l of lengths) if (l) counts[l]++;
    const nextCode: number[] = new Array(16).fill(0);
    let code = 0;
    for (let i = 1; i <= 15; i++) {
      code = (code + counts[i - 1]) << 1;
      nextCode[i] = code;
    }
    for (let sym = 0; sym < lengths.length; sym++) {
      const len = lengths[sym];
      if (!len) continue;
      const c = nextCode[len]++;
      let reversed = 0;
      for (let i = 0; i < len; i++) {
        reversed = (reversed << 1) | ((c >> i) & 1);
      }
      table.set(`${len}:${reversed}`, sym);
    }
    return (): number => {
      let reversed = 0;
      for (let len = 1; len <= 15; len++) {
        reversed = (reversed << 1) | bit();
        const sym = table.get(`${len}:${reversed}`);
        if (sym !== undefined) return sym;
      }
      throw new Error("invalid huffman code in deflate stream");
    };
  };

  const lenBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const lenExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const distExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

  const readBlock = (litLenDecode: () => number, distDecode: () => number) => {
    for (;;) {
      const sym = litLenDecode();
      if (sym < 256) {
        emit(sym);
      } else if (sym === 256) {
        return;
      } else {
        const li = sym - 257;
        if (li >= lenBase.length) throw new Error("bad length symbol");
        const len = lenBase[li] + bits(lenExtra[li]);
        const dsym = distDecode();
        if (dsym >= distBase.length) throw new Error("bad distance symbol");
        const dist = distBase[dsym] + bits(distExtra[dsym]);
        if (dist > out.length) {
          throw new Error("distance beyond output in deflate stream");
        }
        copyFromWindow(dist, len);
      }
    }
  };

  const fixedLitLengths: number[] = [];
  for (let i = 0; i < 144; i++) fixedLitLengths.push(8);
  for (let i = 144; i < 256; i++) fixedLitLengths.push(9);
  for (let i = 256; i < 280; i++) fixedLitLengths.push(7);
  for (let i = 280; i < 288; i++) fixedLitLengths.push(8);
  const fixedDistLengths = new Array(30).fill(5);
  let fixedLit: (() => number) | null = null;
  let fixedDist: (() => number) | null = null;

  for (;;) {
    const last = bit();
    const type = bits(2);
    if (type === 0) {
      // Stored block: discard bit padding, copy raw bytes
      bitCnt = 0;
      if (pos + 4 > input.length) throw new Error("truncated stored block");
      const len = input[pos] | (input[pos + 1] << 8);
      pos += 4;
      for (let i = 0; i < len; i++) emit(input[pos++]);
    } else if (type === 1) {
      if (!fixedLit || !fixedDist) {
        fixedLit = makeDecoder(fixedLitLengths);
        fixedDist = makeDecoder(fixedDistLengths);
      }
      readBlock(fixedLit, fixedDist);
    } else if (type === 2) {
      const hlit = bits(5) + 257;
      const hdist = bits(5) + 1;
      const hclen = bits(4) + 4;
      const order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      const codeLengths = new Array(19).fill(0);
      for (let i = 0; i < hclen; i++) codeLengths[order[i]] = bits(3);
      const decodeCodeLengths = makeDecoder(codeLengths);
      const lengths: number[] = [];
      while (lengths.length < hlit + hdist) {
        const sym = decodeCodeLengths();
        if (sym < 16) {
          lengths.push(sym);
        } else if (sym === 16) {
          if (!lengths.length) throw new Error("bad repeat");
          const prev = lengths[lengths.length - 1];
          const n = bits(2) + 3;
          for (let i = 0; i < n; i++) lengths.push(prev);
        } else if (sym === 17) {
          const n = bits(3) + 3;
          for (let i = 0; i < n; i++) lengths.push(0);
        } else {
          const n = bits(7) + 11;
          for (let i = 0; i < n; i++) lengths.push(0);
        }
      }
      const litDecode = makeDecoder(lengths.slice(0, hlit));
      const distDecodeDyn = makeDecoder(lengths.slice(hlit));
      readBlock(litDecode, distDecodeDyn);
    } else {
      throw new Error("invalid deflate block type");
    }
    if (last) break;
  }

  return Uint8Array.from(out);
}

async function gh(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "shiftedtone-source-publisher",
      ...(init?.headers ?? {}),
    },
  });
}

function fail(scope: string, res: Response, body: string): never {
  throw new Error(`GitHub ${scope} failed: HTTP ${res.status}: ${body.slice(0, 300)}`);
}

export const publishSource = action({
  args: {
    /** Fine-grained GitHub token (Contents: Read and write). Used once; never stored or logged. */
    token: v.string(),
    /** The zip to publish, base64-encoded (shiftedtone-source.zip, ~350 KB). */
    zipB64: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (_ctx, { token, zipB64, message }) => {
    if (!token) {
      throw new Error("No GitHub token supplied — paste a fine-grained token with Contents: Read and write on the /push-source page.");
    }

    const zipBuf = new Uint8Array(Buffer.from(zipB64, "base64"));
    const allEntries = parseZip(zipBuf);
    // Shared, tested guard: secret-file refusal + package.json structure check.
    const { included } = validateSnapshot(allEntries.map((e) => e.name));
    const includedSet = new Set(included);
    const entries = allEntries.filter((e) => includedSet.has(e.name));

    // 1. Current branch head
    const refRes = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, token);
    if (!refRes.ok) fail("ref lookup", refRes, await refRes.text());
    const ref = (await refRes.json()) as { object: { sha: string } };
    const headSha = ref.object.sha;

    // 2. Existing tree -> content-addressed blob set + stale paths to delete
    const treeRes = await gh(`/repos/${OWNER}/${REPO}/git/trees/${headSha}?recursive=1`, token);
    if (!treeRes.ok) fail("tree lookup", treeRes, await treeRes.text());
    const treeJson = (await treeRes.json()) as {
      tree: Array<{ path: string; type: string; sha: string }>;
      truncated?: boolean;
    };
    if (treeJson.truncated) throw new Error("upstream tree too large for recursive listing");
    const remotePaths = new Set(treeJson.tree.filter((t) => t.type === "blob").map((t) => t.path));
    const existingBlobShas = new Set(treeJson.tree.filter((t) => t.type === "blob").map((t) => t.sha));
    const localPaths = new Set(entries.map((e) => e.name));
    const deletions = [...remotePaths]
      .filter((p) => !localPaths.has(p))
      .map((path) => ({ path, mode: "100644" as const, type: "blob" as const, sha: null }));

    // 3. Ensure blobs exist — compute git SHA-1 locally and reuse any blob
    //    already in the repo (identical content); upload the rest in batches.
    const nodeItems: Array<{ path: string; mode: "100644"; type: "blob"; sha: string }> = [];
    let uploaded = 0;
    for (let i = 0; i < entries.length; i += BLOB_UPLOAD_CONCURRENCY) {
      const batch = entries.slice(i, i + BLOB_UPLOAD_CONCURRENCY);
      const shas = await Promise.all(batch.map((e) => gitBlobSha(e.data)));
      const toUpload: Array<{ name: string; sha: string; b64: string }> = [];
      for (let j = 0; j < batch.length; j++) {
        const e = batch[j];
        const sha = shas[j];
        nodeItems.push({ path: e.name, mode: "100644", type: "blob", sha });
        if (!existingBlobShas.has(sha)) {
          toUpload.push({ name: e.name, sha, b64: Buffer.from(e.data).toString("base64") });
        }
      }
      const created = await Promise.all(
        toUpload.map(async (u) => {
          const blobRes = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, token, {
            method: "POST",
            body: JSON.stringify({ content: u.b64, encoding: "base64" }),
          });
          if (!blobRes.ok) fail(`blob create (${u.name})`, blobRes, await blobRes.text());
          const blob = (await blobRes.json()) as { sha: string };
          return { expected: u.sha, got: blob.sha, name: u.name };
        }),
      );
      for (const c of created) {
        if (c.got !== c.expected) {
          throw new Error(`GitHub returned a different blob sha for ${c.name} (${c.got} != ${c.expected})`);
        }
      }
      uploaded += created.length;
    }

    // 4. Commit
    const newTreeRes = await gh(`/repos/${OWNER}/${REPO}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify({ base_tree: headSha, tree: [...nodeItems, ...deletions] }),
    });
    if (!newTreeRes.ok) fail("tree create", newTreeRes, await newTreeRes.text());
    const newTree = (await newTreeRes.json()) as { sha: string };

    if (newTree.sha === headSha) {
      return {
        ok: true as const,
        alreadyUpToDate: true,
        commit: headSha,
        url: `https://github.com/${OWNER}/${REPO}/commit/${headSha}`,
        filesPushed: entries.length,
        filesDeleted: 0,
        blobsUploaded: 0,
        totalZipEntries: allEntries.length,
      };
    }

    const commitMessage =
      message ??
      `Launch-ready source: demo-vs-real labeling, Playwright CT auth tests, Convex 1.46 httpAction fix\n\nAutomated snapshot of the Freebuff project source (${entries.length} files).`;
    const commitRes = await gh(`/repos/${OWNER}/${REPO}/git/commits`, token, {
      method: "POST",
      body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [headSha] }),
    });
    if (!commitRes.ok) fail("commit create", commitRes, await commitRes.text());
    const commit = (await commitRes.json()) as { sha: string };

    // 5. Fast-forward main (refuses if it moved — retry on the new head)
    const updateRes = await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, token, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
    if (!updateRes.ok) {
      const body = await updateRes.text();
      if (updateRes.status === 422) {
        throw new Error("main moved since we started (HTTP 422) — run the push again to retry on the new head.");
      }
      fail("branch update", updateRes, body);
    }

    return {
      ok: true as const,
      alreadyUpToDate: false,
      commit: commit.sha,
      url: `https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`,
      filesPushed: entries.length,
      filesDeleted: deletions.length,
      blobsUploaded: uploaded,
      totalZipEntries: allEntries.length,
    };
  },
});
