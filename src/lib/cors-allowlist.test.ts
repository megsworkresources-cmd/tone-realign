import { describe, expect, test } from "bun:test";
import {
  ALLOWED_ORIGINS,
  configuredSiteOrigin,
  corsHeaders,
  resolveAllowedOrigin,
} from "./cors-allowlist";

/**
 * Regression tests for the launch-week CORS fix: the production Vercel
 * origin (tone-realign.vercel.app) must be reflected, while look-alike and
 * attacker origins are refused. These cases encode the exact contract the
 * Convex /__cors preflight handler depends on.
 */
describe("cors-allowlist", () => {
  test("production Vercel origin is allowed (the launch fix)", () => {
    expect(
      resolveAllowedOrigin("https://tone-realign.vercel.app", {}),
    ).toBe("https://tone-realign.vercel.app");
  });

  test("custom domains are allowed", () => {
    expect(resolveAllowedOrigin("https://shiftedtone.com", {})).toBe(
      "https://shiftedtone.com",
    );
    expect(resolveAllowedOrigin("https://www.shiftedtone.com", {})).toBe(
      "https://www.shiftedtone.com",
    );
  });

  test("local dev origins are allowed", () => {
    expect(resolveAllowedOrigin("http://localhost:5173", {})).toBe(
      "http://localhost:5173",
    );
    expect(resolveAllowedOrigin("http://localhost:4173", {})).toBe(
      "http://localhost:4173",
    );
    expect(resolveAllowedOrigin("http://127.0.0.1:5173", {})).toBe(
      "http://127.0.0.1:5173",
    );
  });

  test("missing Origin header is not allowed (curl / same-origin)", () => {
    expect(resolveAllowedOrigin(null, {})).toBeNull();
    expect(resolveAllowedOrigin(null, { CONVEX_SITE_URL: "https://x.com" })).toBeNull();
  });

  test("unknown origins are blocked", () => {
    expect(resolveAllowedOrigin("https://evil.example.com", {})).toBeNull();
    expect(
      resolveAllowedOrigin("https://tone-realign-vercel-app.evil.example", {}),
    ).toBeNull();
  });

  test("look-alike ports and paths on allowed hosts are blocked", () => {
    // Wrong port must not ride on the localhost allowance.
    expect(resolveAllowedOrigin("http://localhost:9999", {})).toBeNull();
    // Embedded/padded forms must not match exact hosts.
    expect(
      resolveAllowedOrigin("https://shiftedtone.com.evil.example", {}),
    ).toBeNull();
    expect(
      resolveAllowedOrigin("https://evil.example/https://shiftedtone.com", {}),
    ).toBeNull();
  });

  test("scheme swaps are blocked (https host over http)", () => {
    expect(resolveAllowedOrigin("http://shiftedtone.com", {})).toBeNull();
    expect(
      resolveAllowedOrigin("http://tone-realign.vercel.app", {}),
    ).toBeNull();
  });

  test("subdomains of allowed hosts are NOT implicitly allowed", () => {
    expect(resolveAllowedOrigin("https://app.shiftedtone.com", {})).toBeNull();
    expect(
      resolveAllowedOrigin("https://staging.tone-realign.vercel.app", {}),
    ).toBeNull();
  });

  test("origin normalization: case and trailing slash", () => {
    // URL parsing lowercases the host; origin never carries a path.
    expect(resolveAllowedOrigin("HTTPS://TONE-REALIGN.VERCEL.APP", {})).toBe(
      "https://tone-realign.vercel.app",
    );
    expect(resolveAllowedOrigin("https://shiftedtone.com/", {})).toBe(
      "https://shiftedtone.com",
    );
  });

  test("malformed Origin values fail closed", () => {
    expect(resolveAllowedOrigin("not a url", {})).toBeNull();
    expect(resolveAllowedOrigin("https://", {})).toBeNull();
    // Sandboxed-iframe / file:// opaque origin sentinel.
    expect(resolveAllowedOrigin("null", {})).toBeNull();
  });

  test("configured CONVEX_SITE_URL origin is honored", () => {
    expect(
      resolveAllowedOrigin("https://deploy-preview-42.example.vercel.app", {
        CONVEX_SITE_URL: "https://deploy-preview-42.example.vercel.app",
      }),
    ).toBe("https://deploy-preview-42.example.vercel.app");
  });

  test("configured SITE_URL is used when CONVEX_SITE_URL is absent", () => {
    expect(
      resolveAllowedOrigin("https://preview.example.com", {
        SITE_URL: "https://preview.example.com",
      }),
    ).toBe("https://preview.example.com");
  });

  test("CONVEX_SITE_URL takes precedence over SITE_URL", () => {
    expect(
      resolveAllowedOrigin("https://convex-site.example.com", {
        CONVEX_SITE_URL: "https://convex-site.example.com",
        SITE_URL: "https://site-url.example.com",
      }),
    ).toBe("https://convex-site.example.com");
  });

  test("configured-site match does not open the door to other origins", () => {
    expect(
      resolveAllowedOrigin("https://unrelated.example.com", {
        CONVEX_SITE_URL: "https://deploy.example.com",
      }),
    ).toBeNull();
  });

  test("configuredSiteOrigin rejects garbage", () => {
    expect(configuredSiteOrigin(undefined)).toBeNull();
    expect(configuredSiteOrigin("")).toBeNull();
    expect(configuredSiteOrigin("not a url")).toBeNull();
    expect(configuredSiteOrigin("https://ok.example.com")).toBe(
      "https://ok.example.com",
    );
  });

  test("allowlist contains the origins the launch runbook promises", () => {
    // Guard against accidental removal of production origins.
    expect(ALLOWED_ORIGINS.has("https://tone-realign.vercel.app")).toBe(true);
    expect(ALLOWED_ORIGINS.has("https://shiftedtone.com")).toBe(true);
    expect(ALLOWED_ORIGINS.has("https://www.shiftedtone.com")).toBe(true);
  });

  test("corsHeaders reflect the requested origin and carry credentials", () => {
    const h = corsHeaders("https://tone-realign.vercel.app");
    expect(h["Access-Control-Allow-Origin"]).toBe(
      "https://tone-realign.vercel.app",
    );
    expect(h["Access-Control-Allow-Credentials"]).toBe("true");
    expect(h["Access-Control-Allow-Methods"]).toContain("POST");
    expect(h.Vary).toBe("Origin");
  });
});
