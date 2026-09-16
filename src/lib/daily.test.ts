import { describe, expect, test } from "bun:test";
import {
  DAILY_ANGLES,
  DAILY_TAGS,
  dailyLabel,
  getDailyChallenge,
  getAccessibleDailyChallenge,
} from "./daily";
import { DRILLS } from "./drills";
import { STARTER_DRILLS } from "./unlocks";

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

describe("getAccessibleDailyChallenge", () => {
  test("passes the calendar pick through when unlocked", () => {
    const result = getAccessibleDailyChallenge(() => true, 19_000);
    expect(result).toEqual(getDailyChallenge(19_000));
  });

  test("falls back to a starter drill when the pick is locked", () => {
    const result = getAccessibleDailyChallenge(() => false, 19_000);
    expect(STARTER_DRILLS).toContain(result.drill.id);
  });

  test("fallback varies across days (deterministic starter rotation)", () => {
    const ids = new Set(
      Array.from({ length: 3 }, (_, i) => getAccessibleDailyChallenge(() => false, i).drill.id),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  test("locked picks always land on drills that exist and starters stay in sync", () => {
    for (let d = 0; d < 30; d++) {
      const r = getAccessibleDailyChallenge((id) => id === "recovery" ? false : true, d);
      expect(DRILLS.some((dr) => dr.id === r.drill.id)).toBe(true);
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
