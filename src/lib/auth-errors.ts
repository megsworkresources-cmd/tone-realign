/**
 * Auth error mapping — the layer between Convex Auth's thrown errors and the
 * user. Raw backend/provider errors are logged by the caller for support but
 * are never shown verbatim in the UI; known cases get specific copy, unknown
 * cases get a friendly fallback. Pure functions so the mapping stays
 * unit-testable (same pattern as lib/redirect.ts).
 */

const EMAIL_FALLBACK_ERROR =
  "Something went wrong sending your verification code. Please check your email address and try again.";
const OTP_FALLBACK_ERROR =
  "That code didn't work. Please check the code in your email and try again.";

export const GUEST_UNAVAILABLE_ERROR =
  "Guest access isn't available right now. Please continue with your email.";

/** Map known email-step backend errors to clear copy; everything else falls back. */
export function friendlyEmailError(error: unknown): string {
  const raw = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    (raw.includes("invalid") || raw.includes("missing")) &&
    (raw.includes("email") || raw.includes("identifier"))
  ) {
    return "That email address doesn't look right. Please check it and try again.";
  }
  if (raw.includes("rate") || raw.includes("too many")) {
    return "Too many attempts just now. Please wait a minute and try again.";
  }
  return EMAIL_FALLBACK_ERROR;
}

/** Map known OTP-step backend errors to clear copy; everything else falls back. */
export function friendlyOtpError(error: unknown): string {
  const raw = error instanceof Error ? error.message.toLowerCase() : "";
  if (raw.includes("expired")) {
    return "That code has expired. Go back below and we'll send you a fresh one.";
  }
  if (raw.includes("rate") || raw.includes("too many")) {
    return "Too many attempts just now. Please wait a minute and try again.";
  }
  return OTP_FALLBACK_ERROR;
}
