import { describe, expect, test } from "bun:test";
import { READING_LIST } from "./reading-list";

describe("reading list curation", () => {
  test("every resource points at a reputable, direct source", () => {
    const trustedHosts = [
      "charlesduhigg.com",
      "www.ted.com",
      "hbr.org",
      "www.gottman.com",
      "www.youtube.com", // TED-Ed official channel upload
      "ted.com",
      "gottman.com",
      "www.scienceofpeople.com", // Van Edwards' official research lab
      "www.chasehughesofficial.com", // Hughes' official site
    ];
    for (const r of READING_LIST) {
      const host = new URL(r.url).hostname;
      expect(trustedHosts).toContain(host);
    }
  });

  test("entries are complete: title, source authority, blurb, valid URL, kind", () => {
    const kinds = new Set(["book", "article", "research", "podcast", "tool"]);
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
});
