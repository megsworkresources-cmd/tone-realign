/**
 * Security guard for the GitHub source-push (src/convex/githubPush.ts).
 *
 * Pure functions only (no Convex imports) so they can be unit-tested with
 * `bun test` and reused wherever snapshot filtering is needed. Mirrors
 * scripts/make-source-zip.py's exclusion rules.
 *
 * Security invariants enforced here:
 *  1. No secret-bearing file may reach the repository — this includes nested
 *     env files (e.g. `config/.env.local`), dotenvx key files, PEM/JWT/PVK
 *     key material, and common credential-file names, at ANY path depth.
 *  2. A snapshot without a root `package.json` is a broken extract (the
 *     nested-folder bug that once broke the Vercel build) and is refused.
 *  3. `.env.example` is a tracked placeholder template, not a secret — it is
 *     explicitly allowed (it contains no real values by policy, see
 *     SECURITY.md).
 */

/** Exact path prefixes that must never be pushed (file or directory). */
const EXCLUDED_PREFIXES = [
  ".env.keys",
  ".env.local",
  "public/shiftedtone-source.zip",
  "shiftedtone-source.zip",
];

const EXCLUDED_BASENAMES = new Set([".DS_Store"]);
const EXCLUDED_SUFFIXES = [".pyc", ".log"];

/** Basenames of credential-bearing files, matched at any path depth. */
const SECRET_BASENAMES = new Set([
  ".env",
  ".env.local",
  ".env.keys",
  ".env.production",
  ".env.development",
  ".env.secrets",
  ".npmrc", // can carry _authToken
  ".netrc",
  "credentials.json", // gcloud service-account keys
  "serviceAccountKey.json", // Firebase admin SDK
]);

/** Suffixes of private-key material (PEM, PuTTY, Java keystores). */
const SECRET_SUFFIXES = [
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".jks",
  ".keystore",
];

/** True if a zip entry at `name` should be included in the pushed snapshot. */
export function shouldInclude(name: string): boolean {
  if (name.endsWith("/")) return false;
  if (EXCLUDED_BASENAMES.has(name.split("/").pop() ?? "")) return false;
  if (EXCLUDED_SUFFIXES.some((s) => name.endsWith(s))) return false;
  if (EXCLUDED_PREFIXES.some((p) => name === p || name.startsWith(p + "/"))) return false;
  return true;
}

/** True if the entry looks like secret/credential material at any depth. */
export function looksLikeSecret(name: string): boolean {
  if (name.startsWith(".env") && name !== ".env.example") return true;
  if (name.endsWith("/.env.example")) return true; // nested copies are unusual — refuse
  const base = name.split("/").pop() ?? "";
  if (SECRET_BASENAMES.has(base)) return true;
  if (SECRET_SUFFIXES.some((s) => base.endsWith(s))) return true;
  return false;
}

export interface GuardResult {
  /** Entries that passed the inclusion filter (already excludes secrets). */
  included: string[];
  /** Total entries inspected (before filtering). */
  totalEntries: number;
}

/** Git blob SHA-1 over "blob <len>\0" + content (matches `git hash-object`). */
export async function gitBlobSha(data: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${data.length}\0`);
  const payload = new Uint8Array(header.length + data.length);
  payload.set(header, 0);
  payload.set(data, header.length);
  const digest = await crypto.subtle.digest("SHA-1", payload);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate a parsed snapshot's entry names before anything is uploaded.
 * Throws with an operator-readable message on any violation — the caller
 * must not push when this throws.
 */
export function validateSnapshot(entryNames: string[]): GuardResult {
  // Secret scan runs on ALL entries — including ones the packaging filter
  // would drop — so a snapshot containing any secret file is refused loudly
  // (the operator should know something is wrong upstream) rather than
  // silently filtered.
  const secrets = entryNames.filter((n) => looksLikeSecret(n));
  if (secrets.length > 0) {
    throw new Error(
      `refusing to push: secret/credential file(s) present in snapshot: ${secrets.slice(0, 5).join(", ")}`,
    );
  }

  const included = entryNames.filter((n) => shouldInclude(n));

  if (!included.some((n) => n === "package.json")) {
    throw new Error(
      "package.json missing from snapshot root — refusing to push a broken extract (nested-folder snapshot?)",
    );
  }

  return { included, totalEntries: entryNames.length };
}
