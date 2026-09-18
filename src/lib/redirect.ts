/**
 * Post-auth redirect resolution. Only internal, relative paths are allowed —
 * anything else (protocol-relative "//host", absolute URLs, javascript:/data:
 * schemes, backslash tricks, control characters) falls back to the default.
 * Pure function so the open-redirect protection stays unit-testable.
 */
export function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
): string {
  if (!returnTo) return fallback;
  // Reject anything that isn't a plain relative path: no schemes (http:,
  // javascript:), no protocol-relative hosts (//), no backslash host tricks
  // (/\evil.com parses as host in some agents), no control characters.
  if (!returnTo.startsWith("/")) return fallback;
  if (returnTo.startsWith("//") || returnTo.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(returnTo)) return fallback;
  return returnTo;
}
