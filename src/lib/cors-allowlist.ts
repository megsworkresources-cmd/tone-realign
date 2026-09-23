/**
 * Pure CORS origin-allowlist logic, shared by src/convex/http.ts.
 * Kept free of Convex imports so it is trivially unit-testable (the
 * src/lib/*.test.ts convention used across this repo).
 *
 * Rules mirror the live /__cors preflight handler:
 *  - No Origin header → not allowed (non-browser clients don't need CORS).
 *  - Exact match against the explicit allowlist, OR exact match against the
 *    deployment's configured site URL (CONVEX_SITE_URL / SITE_URL).
 *  - Everything else → blocked. Parse failures never throw.
 */

/** Origins allowed to call Convex HTTP endpoints from a browser. */
export const ALLOWED_ORIGINS = new Set([
  "https://shiftedtone.com",
  "https://www.shiftedtone.com",
  "https://tone-realign.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
]);

function originFrom(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Resolve a configured site-URL env value to a comparable origin. */
export function configuredSiteOrigin(
  configuredSite: string | undefined,
): string | null {
  if (!configuredSite) return null;
  return originFrom(configuredSite);
}

/**
 * Decide whether a request's Origin may be reflected as a CORS-allowed
 * origin. This is the exact contract the /__cors handler relies on.
 */
export function resolveAllowedOrigin(
  originHeader: string | null,
  env: { CONVEX_SITE_URL?: string; SITE_URL?: string },
): string | null {
  if (!originHeader) return null;

  const origin = originFrom(originHeader);
  if (!origin || origin === "null") return null;

  if (ALLOWED_ORIGINS.has(origin)) return origin;

  const siteOrigin = configuredSiteOrigin(env.CONVEX_SITE_URL ?? env.SITE_URL);
  if (siteOrigin && origin === siteOrigin) return origin;

  return null;
}

/** Build the CORS response headers for an allowed origin. */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
