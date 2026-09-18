import { describe, expect, test } from "bun:test";
import {
  friendlyEmailError,
  friendlyOtpError,
  GUEST_UNAVAILABLE_ERROR,
} from "./auth-errors";

describe("friendlyEmailError", () => {
  test("maps invalid/missing email errors to specific copy", () => {
    expect(friendlyEmailError(new Error("Invalid email address"))).toBe(
      "That email address doesn't look right. Please check it and try again.",
    );
    expect(friendlyEmailError(new Error("MISSING IDENTIFIER"))).toBe(
      "That email address doesn't look right. Please check it and try again.",
    );
  });

  test("maps rate-limit errors to a wait message", () => {
    expect(friendlyEmailError(new Error("Rate limit exceeded"))).toBe(
      "Too many attempts just now. Please wait a minute and try again.",
    );
    expect(friendlyEmailError(new Error("Too many requests"))).toBe(
      "Too many attempts just now. Please wait a minute and try again.",
    );
  });

  test("falls back to generic copy for unknown errors", () => {
    expect(friendlyEmailError(new Error("ECONNRESET"))).toBe(
      "Something went wrong sending your verification code. Please check your email address and try again.",
    );
  });

  test("handles non-Error rejections without crashing", () => {
    expect(friendlyEmailError("string rejection")).toBe(
      "Something went wrong sending your verification code. Please check your email address and try again.",
    );
    expect(friendlyEmailError(undefined)).toBe(
      "Something went wrong sending your verification code. Please check your email address and try again.",
    );
  });

  test("never returns the raw error message", () => {
    const secret = "internal db dsn: postgres://user:pass@host";
    const message = friendlyEmailError(new Error(secret));
    expect(message).not.toContain(secret);
  });
});

describe("friendlyOtpError", () => {
  test("maps expired codes to a resend hint", () => {
    expect(friendlyOtpError(new Error("Code has expired"))).toBe(
      "That code has expired. Go back below and we'll send you a fresh one.",
    );
  });

  test("maps rate-limit errors to a wait message", () => {
    expect(friendlyOtpError(new Error("Too many attempts"))).toBe(
      "Too many attempts just now. Please wait a minute and try again.",
    );
  });

  test("falls back to generic copy for wrong/unknown codes", () => {
    expect(friendlyOtpError(new Error("invalid code"))).toBe(
      "That code didn't work. Please check the code in your email and try again.",
    );
    expect(friendlyOtpError(new Error("random failure"))).toBe(
      "That code didn't work. Please check the code in your email and try again.",
    );
  });

  test("never returns the raw error message", () => {
    const secret = "attempt 3 of 5, account 12345 locked";
    const message = friendlyOtpError(new Error(secret));
    expect(message).not.toContain(secret);
  });
});

describe("GUEST_UNAVAILABLE_ERROR", () => {
  test("directs users to the email flow", () => {
    expect(GUEST_UNAVAILABLE_ERROR).toContain("email");
  });
});
