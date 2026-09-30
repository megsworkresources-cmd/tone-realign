import { describe, expect, test } from "bun:test";
import {
  CHECKLIST_ACTIONS,
  DAILY_ACTIONS,
  dailyProgressPct,
  levelInfo,
  XP,
  type DailyActionId,
} from "./gamify";

describe("XP and levels", () => {
  test("every action pays positive XP", () => {
    for (const value of Object.values(XP)) {
      expect(value).toBeGreaterThan(0);
    }
    for (const action of DAILY_ACTIONS) {
      expect(action.xp).toBe(XP[action.id]);
    }
  });

  test("levelInfo is monotonic across the whole XP range", () => {
    let prev = -1;
    for (let xp = 0; xp <= 6000; xp += 137) {
      const info = levelInfo(xp);
      expect(info.level).toBeGreaterThanOrEqual(prev);
      prev = info.level;
    }
  });

  test("level boundaries land exactly", () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(0).label).toBe("Warm-Up");
    expect(levelInfo(149).level).toBe(1);
    expect(levelInfo(150).level).toBe(2);
    expect(levelInfo(999999).maxed).toBe(true);
    expect(levelInfo(999999).progressPct).toBe(100);
  });

  test("progress math never exceeds 100 or goes negative", () => {
    for (const xp of [0, 10, 150, 399, 400, 1400, 4600, 100000]) {
      const info = levelInfo(xp);
      expect(info.progressPct).toBeGreaterThanOrEqual(0);
      expect(info.progressPct).toBeLessThanOrEqual(100);
      expect(info.xpToNext).toBeGreaterThanOrEqual(0);
    }
  });
});

