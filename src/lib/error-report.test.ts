import { describe, expect, test } from "bun:test";
import { isRuntimeError, normalizeRejection } from "./error-report";

describe("normalizeRejection", () => {
  test("Error instance keeps message and stack", () => {
    const err = new Error("boom");
    const { error, stack } = normalizeRejection(err);
    expect(error).toBe("boom");
    expect(stack).toContain("boom");
  });

  test("custom Error subclasses keep their message", () => {
    class NetworkError extends Error {
      constructor(msg: string) {
        super(msg);
        this.name = "NetworkError";
      }
    }
    const { error } = normalizeRejection(new NetworkError("timeout after 5s"));
    expect(error).toBe("timeout after 5s");
  });

  test("string reason passes through as the message", () => {
    expect(normalizeRejection("AI coach is unavailable")).toEqual({
      error: "AI coach is unavailable",
      stack: "",
    });
  });

  test("empty string falls back to generic message", () => {
    expect(normalizeRejection("").error).toBe("Unhandled promise rejection");
  });

  test("undefined and null reasons never produce undefined/NaN output", () => {
    for (const reason of [undefined, null, 42, { code: 7 }, Symbol("x")]) {
      const result = normalizeRejection(reason);
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
      expect(result.stack).toBe("");
    }
  });
});

describe("isRuntimeError", () => {
  test("error events carrying an Error are runtime errors", () => {
    expect(isRuntimeError({ error: new TypeError("x is null") })).toBe(true);
  });

  test("resource load failures (no Error object) are not runtime errors", () => {
    expect(isRuntimeError({ error: null })).toBe(false);
    expect(isRuntimeError({ error: undefined })).toBe(false);
  });
});
