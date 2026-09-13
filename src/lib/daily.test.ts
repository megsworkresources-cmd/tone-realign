import { describe, expect, test } from "bun:test";
import {
  DAILY_ANGLES,
  DAILY_TAGS,
  dailyLabel,
  getDailyChallenge,
} from "./daily";
import { DRILLS } from "./drills";

describe("getDailyChallenge", () => {
  test("same day always yields the same challenge", () => {
    const a = getDailyChallenge(19_000);
    const b = getDailyChallenge(19_000);
    expect(a).toEqual(b);
  });

  test("rotates through every drill in the catalog", () => {
    const seen = new Set<number>();
    for (let d = 0; d < DRILLS.length * 7; d++) {
      seen.add(DRILLS.indexOf(getDailyChallenge(d).drill));
    }
    expect(seen.size).toBe(DRILLS.length);
  });

  test("tomorrow is different from today (drill or angle)", () => {
    for (let d = 0; d < 60; d++) {
      const today = getDailyChallenge(d);
      const tomorrow = getDailyChallenge(d + 1);
      const differs =
        today.drill.id !== tomorrow.drill.id || today.angle !== tomorrow.angle;
      expect(differs).toBe(true);
    }
  });

  test("the combo (drill × angle) cycles over the full set before repeating", () => {
    const cycle = DRILLS.length * DAILY_ANGLES.length; // 35
    const a = getDailyChallenge(1_000);
    const b = getDailyChallenge(1_000 + cycle);
    expect(a.drill.id).toBe(b.drill.id);
    expect(a.angle).toBe(b.angle);
  });

  test("angles and tags come from their catalogs", () => {
    for (let d = 0; d < 200; d += 3) {
      const c = getDailyChallenge(d);
      expect(DAILY_ANGLES).toContain(c.angle);
      expect(DAILY_TAGS).toContain(c.tag);
    }
  });
});

describe("dailyLabel", () => {
  test("formats a readable date for a known day number", () => {
    // Day 0 = Jan 1, 1970 local — formatting varies by TZ, so just assert shape.
    expect(dailyLabel(0)).toMatch(/,/);
    expect(dailyLabel(0).length).toBeGreaterThan(10);
  });

  test("adjacent days produce different labels", () => {
    expect(dailyLabel(19_000)).not.toBe(dailyLabel(19_001));
  });
});
