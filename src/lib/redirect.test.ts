import { describe, expect, test } from "bun:test";
import { resolveRedirectAfterAuth } from "./redirect";

describe("resolveRedirectAfterAuth", () => {
  test("allows plain internal paths", () => {
    expect(resolveRedirectAfterAuth("/dashboard")).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("/gym")).toBe("/gym");
    expect(resolveRedirectAfterAuth("/practice/steady-ground")).toBe(
      "/practice/steady-ground",
    );
    expect(resolveRedirectAfterAuth("/gym?drill=calm&step=2")).toBe(
      "/gym?drill=calm&step=2",
    );
  });

  test("rejects external and protocol-relative redirects", () => {
    expect(resolveRedirectAfterAuth("//malicious-site.com")).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("https://malicious-site.com")).toBe(
      "/dashboard",
    );
    expect(resolveRedirectAfterAuth("http://evil.com")).toBe("/dashboard");
  });

  test("rejects javascript: and data: schemes", () => {
    expect(resolveRedirectAfterAuth("javascript:alert(1)")).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("data:text/html,<script>")).toBe(
      "/dashboard",
    );
    expect(resolveRedirectAfterAuth("JAVASCRIPT:x")).toBe("/dashboard");
  });

  test("rejects backslash host tricks and control characters", () => {
    expect(resolveRedirectAfterAuth("/\\evil.com")).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("/dash\u0000board")).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("/gym\n")).toBe("/dashboard");
  });

  test("falls back on empty or null returnTo", () => {
    expect(resolveRedirectAfterAuth(null)).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("")).toBe("/dashboard");
    expect(resolveRedirectAfterAuth("dashboard")).toBe("/dashboard");
  });

  test("honors a custom fallback", () => {
    expect(resolveRedirectAfterAuth(null, "/gym")).toBe("/gym");
    expect(resolveRedirectAfterAuth("//evil.com", "/gym")).toBe("/gym");
  });
});
