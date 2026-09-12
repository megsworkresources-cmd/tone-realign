import { describe, expect, test } from "bun:test";
import { WATCH_LIST, videoThumb } from "./watch-list";

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

describe("WATCH_LIST", () => {
  test("contains the five curated videos in curation order", () => {
    expect(WATCH_LIST.map((v) => v.id)).toEqual([
      "ZcvbDuTeEhQ",
      "bNIPVejCzyY",
      "3tR-2fnzUEo",
      "Jp2SBS1LTuk",
      "FD3H1dpPGtk",
    ]);
  });

  test("all entries are valid, unique YouTube ids", () => {
    const ids = WATCH_LIST.map((v) => v.id);
    for (const id of ids) {
      expect(YT_ID_RE.test(id)).toBe(true);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("only Jefferson Fisher and Vanessa Van Edwards videos are curated", () => {
    const allowed = new Set([
      "ZcvbDuTeEhQ",
      "bNIPVejCzyY",
      "3tR-2fnzUEo", // Jefferson Fisher
      "Jp2SBS1LTuk",
      "FD3H1dpPGtk", // Vanessa Van Edwards
    ]);
    for (const v of WATCH_LIST) {
      expect(allowed.has(v.id)).toBe(true);
    }
    // Mel Robbins + the Jay Shetty / Nicholeen Peck removals stay out
    const removed = new Set([
      "QMSTcIaa74Q",
      "5hvVjOqk_4o",
      "uRQAhWZ1bxs",
      "XfVcnrNcBz4",
    ]);
    const ids = WATCH_LIST.map((v) => v.id);
    expect(ids).toEqual(ids.filter((id) => !removed.has(id)));
  });

  test("every card has non-empty title, meta, and accent color", () => {
    for (const v of WATCH_LIST) {
      expect(v.title.trim().length).toBeGreaterThan(0);
      expect(v.meta.trim().length).toBeGreaterThan(0);
      expect(v.color.trim().length).toBeGreaterThan(0);
    }
  });

  test("accent colors rotate through the theme palette without repeating adjacently", () => {
    const palette = new Set(["bg-sun", "bg-mint", "bg-coral", "bg-paper"]);
    for (const v of WATCH_LIST) {
      expect(palette.has(v.color)).toBe(true);
    }
    for (let i = 1; i < WATCH_LIST.length; i++) {
      expect(WATCH_LIST[i].color).not.toBe(WATCH_LIST[i - 1].color);
    }
  });

  test("durations are only present where verified (no Short or unverified card gets a chip)", () => {
    const shortsAndUnverified = new Set(["Jp2SBS1LTuk", "FD3H1dpPGtk"]);
    for (const v of WATCH_LIST) {
      if (shortsAndUnverified.has(v.id)) {
        expect(v.minutes).toBeUndefined();
      } else if (v.minutes !== undefined) {
        expect(v.minutes).toBeGreaterThan(0);
      }
    }
  });
});

describe("videoThumb", () => {
  test("builds hqdefault thumbnail URLs", () => {
    expect(videoThumb("ZcvbDuTeEhQ")).toBe(
      "https://i.ytimg.com/vi/ZcvbDuTeEhQ/hqdefault.jpg",
    );
  });

  test("works for Shorts ids too", () => {
    expect(videoThumb("FD3H1dpPGtk")).toBe(
      "https://i.ytimg.com/vi/FD3H1dpPGtk/hqdefault.jpg",
    );
  });
});
