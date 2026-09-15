import { describe, expect, test } from "bun:test";
import {
  ACHIEVEMENTS,
  CHECKLIST_ACTIONS,
  DAILY_ACTIONS,
  dailyProgressPct,
  earnedAchievements,
  levelInfo,
  XP,
  type AchievementStats,
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

describe("daily checklist contract", () => {
  test("checklist is exactly the four core actions — translate excluded", () => {
    expect(CHECKLIST_ACTIONS).toEqual(["take", "quiz", "reframe", "reset"]);
    expect(CHECKLIST_ACTIONS).not.toContain("translate");
  });

  test("translate does not dilute the completion percentage", () => {
    // Four core habits done → 100% even with translate also in the log
    const all: DailyActionId[] = ["take", "quiz", "reframe", "reset", "translate"];
    expect(dailyProgressPct(all)).toBe(100);
    // Three core habits + translate → still 75%, translate is not a slot
    expect(dailyProgressPct(["take", "quiz", "reframe", "translate"])).toBe(75);
    // Translate alone → 0%
    expect(dailyProgressPct(["translate"])).toBe(0);
  });

  test("duplicate entries cannot inflate the percentage", () => {
    expect(dailyProgressPct(["take", "take", "take"])).toBe(25);
  });

  test("sweep requires the four core habits — translate never completes it", () => {
    // The server pays the sweep when non-translate completions hit 4; the
    // client contract here is the same four-slot list it derives from.
    const core: DailyActionId[] = ["take", "quiz", "reframe", "reset"];
    expect(dailyProgressPct(core)).toBe(100);
    expect(dailyProgressPct(["quiz", "reframe", "reset", "translate" as DailyActionId])).toBe(75);
  });

  test("every checklist action pays its advertised XP", () => {
    for (const action of DAILY_ACTIONS) {
      expect(action.xp).toBeGreaterThan(0);
    }
  });
});

describe("achievements", () => {
  const zeroStats: AchievementStats = {
    totalSessions: 0,
    totalMinutes: 0,
    bestOverall: 0,
    totalQuiz: 0,
    totalReframes: 0,
    totalResets: 0,
    streakDays: 0,
    drillsTried: 0,
    drills: 5,
  };

  test("zero stats earn nothing", () => {
    expect(earnedAchievements(zeroStats)).toEqual([]);
  });

  test("each achievement is achievable by its documented threshold", () => {
    const cases: [string, Partial<AchievementStats>][] = [
      ["first-word", { totalSessions: 1 }],
      ["full-circuit", { drillsTried: 5 }],
      ["week-streak", { streakDays: 7 }],
      ["high-score", { bestOverall: 85 }],
      ["room-reader", { totalQuiz: 10 }],
      ["reframer", { totalReframes: 5 }],
      ["deep-breaths", { totalResets: 10 }],
      ["ten-takes", { totalSessions: 10 }],
      ["sixty-minutes", { totalMinutes: 60 }],
    ];
    for (const [id, over] of cases) {
      const stats = { ...zeroStats, ...over };
      expect(earnedAchievements(stats)).toContain(id);
    }
  });

  test("achievement ids are unique and tiers valid", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(["bronze", "silver", "gold"]).toContain(a.tier);
      expect(a.detail.length).toBeGreaterThan(0);
    }
  });
});
