import { describe, expect, test } from "bun:test";
import {
  gitBlobSha,
  looksLikeSecret,
  shouldInclude,
  validateSnapshot,
} from "./source-guard";

/**
 * Security-guard tests for the GitHub source-push snapshot filter
 * (src/lib/source-guard.ts) and the local git blob-SHA helper.
 *
 * These verify the invariants documented in SECURITY.md: no secret file can
 * reach the repository, and a broken/nested extract (missing root
 * package.json) is refused before any network call.
 */
describe("source-guard: shouldInclude (packaging filter)", () => {
  test.each([
    "package.json",
    "src/main.tsx",
    "src/convex/githubPush.ts",
    ".env.example", // tracked placeholder template, no secrets by policy
    "public/logo.svg",
    "docs/notes.md",
  ])("includes %s", (name) => {
    expect(shouldInclude(name)).toBe(true);
  });

  test.each([
    ".env.keys",
    ".env.local",
    "shiftedtone-source.zip",
    "public/shiftedtone-source.zip",
    "dir/.DS_Store",
    "src/x.pyc",
    "src/x.log",
    "somedir/",
  ])("excludes %s", (name) => {
    expect(shouldInclude(name)).toBe(false);
  });
});

describe("source-guard: looksLikeSecret", () => {
  test("refuses env/secret files at any depth", () => {
    for (const name of [
      ".env",
      ".env.local",
      ".env.keys",
      ".env.production",
      "config/.env",
      "config/.env.local",
      "server/.env.keys",
      "deep/nested/.npmrc",
      "deep/nested/.netrc",
      "server.pem",
      "server.key",
      "deep/nested/server.pem",
      "certs/cert.p12",
      "keystore.jks",
      "keystore.keystore",
      "gcloud/credentials.json",
      "firebase/serviceAccountKey.json",
    ]) {
      expect(looksLikeSecret(name)).toBe(true);
    }
  });

  test("allows .env.example at root, refuses nested copies", () => {
    expect(looksLikeSecret(".env.example")).toBe(false);
    expect(looksLikeSecret("config/.env.example")).toBe(true);
  });

  test("allows normal files that merely mention env", () => {
    for (const name of [
      "src/lib/env.ts",
      "src/lib/env.example.ts",
      "docs/environment.md",
      "src/components/EnvBadge.tsx",
      "public/env-icons.svg",
    ]) {
      expect(looksLikeSecret(name)).toBe(false);
    }
  });
});

describe("source-guard: validateSnapshot", () => {
  const good = [
    "package.json",
    ".env.example",
    "src/main.tsx",
    "vite.config.ts",
  ];

  test("accepts a well-formed snapshot", () => {
    const result = validateSnapshot(good);
    expect(result.included).toEqual(good);
    expect(result.totalEntries).toBe(good.length);
  });

  test("refuses any secret file, even nested (regression: old root-only check)", () => {
    for (const intruder of [
      ".env.local",
      "config/.env.local",
      "config/.env",
      "server.pem",
      "deep/nested/.npmrc",
      "gcloud/credentials.json",
    ]) {
      expect(() => validateSnapshot([...good, intruder])).toThrow(/secret/);
    }
  });

  test("refuses a missing root package.json (nested-folder extract bug)", () => {
    expect(() =>
      validateSnapshot(["src/main.tsx", "vite.config.ts", ".env.example"]),
    ).toThrow(/package\.json/);
  });

  test("refuses an empty snapshot", () => {
    expect(() => validateSnapshot([])).toThrow(/package\.json/);
  });

  test("error message names the offending file", () => {
    expect(() => validateSnapshot(["package.json", "creds/.env.keys"])).toThrow(
      /creds\/\.env\.keys/,
    );
  });
});

describe("gitBlobSha (git-compatible SHA-1)", () => {
  test("matches git's known vectors", async () => {
    // Vectors computed from git's canonical object format: the empty-blob
    // SHA below is git's well-known empty blob.
    expect(await gitBlobSha(new TextEncoder().encode("foo"))).toBe(
      "19102815663d23f8b75a47e7a01965dcdc96468c",
    );
    expect(await gitBlobSha(new Uint8Array(0))).toBe(
      "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
    );
  });

  test("produces 40-hex output for large payloads", async () => {
    const big = new Uint8Array(3 * 1024 * 1024).fill(0x61); // 3 MB of 'a'
    expect(await gitBlobSha(big)).toMatch(/^[0-9a-f]{40}$/);
  });
});
