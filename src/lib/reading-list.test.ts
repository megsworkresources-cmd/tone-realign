import { describe, expect, test } from "bun:test";
import { READING_LIST } from "./reading-list";

describe("reading list curation", () => {
  test("every resource is a reputable, free, direct source", () => {
    const trustedHosts = [
      "ggia.berkeley.edu", // UC Berkeley Greater Good in Action
      "www.scienceofpeople.com", // Van Edwards' official research lab
      "www.cnvc.org", // Center for Nonviolent Communication
      "www.ted.com",
      "ted.com",
      "www.gottman.com",
      "gottman.com",
      "www.helpguide.org", // nonprofit, Harvard Medical School advisors
      "pudding.cool",
    ];
    for (const r of READING_LIST) {
      const host = new URL(r.url).hostname;
      expect(trustedHosts).toContain(host);
    }
  });

  test("entries are complete: title, source authority, blurb, valid URL, kind", () => {
    const kinds = new Set(["article", "research", "tool"]);
    for (const r of READING_LIST) {
      expect(r.title.length).toBeGreaterThan(5);
      expect(r.source.length).toBeGreaterThan(5);
      expect(r.blurb.length).toBeGreaterThan(30);
      expect(() => new URL(r.url)).not.toThrow();
      expect(r.url.startsWith("https://")).toBe(true);
      expect(kinds.has(r.kind)).toBe(true);
    }
  });

  test("titles are unique", () => {
    const titles = READING_LIST.map((r) => r.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  test("accent colors come from the theme palette and alternate without adjacent repeats", () => {
    const palette = /^bg-(sun|mint|coral|paper|card|secondary)$/;
    READING_LIST.forEach((r, i) => {
      expect(r.color).toMatch(palette);
      if (i > 0) {
        expect(r.color).not.toBe(READING_LIST[i - 1].color);
      }
    });
  });

  test("no paywalled or paid resources: the shelf is all free web", () => {
    const paywalled = ["hbr.org", "charlesduhigg.com", "www.chasehughesofficial.com"];
    for (const r of READING_LIST) {
      const host = new URL(r.url).hostname;
      expect(paywalled).not.toContain(host);
      expect(r.source.toLowerCase()).not.toContain("book");
    }
  });
});
