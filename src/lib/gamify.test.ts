import { describe, expect, test } from "bun:test";
import {
  ACHIEVEMENTS,
  DAILY_ACTIONS,
  dailyProgressPct,
  earnedAchievements,
  levelInfo,
  XP,
  type AchievementStats,
} from "./gamify";

const emptyStats: AchievementStats = {
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

describe("levelInfo", () => {
  test("level 1 starts at zero XP with a known band", () => {
    const l = levelInfo(0);
    expect(l.level).toBe(1);
    expect(l.label).toBe("Warm-Up");
    expect(l.into).toBe(0);
    expect(l.needed).toBe(150);
    expect(l.progressPct).toBe(0);
    expect(l.nextLabel).toBe("Steady Hand");
    expect(l.maxed).toBe(false);
  });

  test("bands advance at exact thresholds", () => {
    expect(levelInfo(149).label).toBe("Warm-Up");
    expect(levelInfo(150).label).toBe("Steady Hand");
    expect(levelInfo(400).label).toBe("Clear Signal");
  });

  test("progress fills proportionally inside a band", () => {
    const l = levelInfo(75);
    expect(l.progressPct).toBe(50);
    expect(l.xpToNext).toBe(75);
  });

  test("top level reports maxed with full progress", () => {
    const l = levelInfo(9_999_999);
    expect(l.maxed).toBe(true);
    expect(l.progressPct).toBe(100);
    expect(l.nextLabel).toBeUndefined();
  });

  test("levels advance strictly across one sample per level", () => {
    const infos = [0, 150, 400, 800, 1400, 2200, 3200, 4600].map(levelInfo);
    const labels = new Set(infos.map((i) => i.label));
    expect(labels.size).toBe(infos.length);
    for (let i = 1; i < infos.length; i++) {
      expect(infos[i].level).toBeGreaterThan(infos[i - 1].level);
    }
  });
});

describe("daily checklist", () => {
  test("four actions with positive, non-equal-ish XP", () => {
    expect(DAILY_ACTIONS).toHaveLength(4);
    for (const a of DAILY_ACTIONS) {
      expect(a.xp).toBeGreaterThan(0);
      expect(a.label.length).toBeGreaterThan(0);
    }
    expect(new Set(DAILY_ACTIONS.map((a) => a.id)).size).toBe(4);
  });

  test("progress math covers empty, partial, full", () => {
    expect(dailyProgressPct([])).toBe(0);
    expect(dailyProgressPct(["take", "quiz"])).toBe(50);
    expect(dailyProgressPct(["take", "quiz", "reframe", "reset"])).toBe(100);
  });

  test("duplicates do not inflate progress", () => {
    expect(dailyProgressPct(["take", "take", "take"])).toBe(25);
  });
});

describe("achievements", () => {
  test("unique ids across tiers", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      expect(["bronze", "silver", "gold"]).toContain(a.tier);
      expect(a.detail.length).toBeGreaterThan(0);
    }
  });

  test("empty stats earn nothing (new user lands clean)", () => {
    expect(earnedAchievements(emptyStats)).toEqual([]);
  });

  test("first take earns exactly First Word", () => {
    const earned = earnedAchievements({ ...emptyStats, totalSessions: 1 });
    expect(earned).toEqual(["first-word"]);
  });

  test("full-circuit requires every drill tried", () => {
    expect(
      earnedAchievements({ ...emptyStats, totalSessions: 9, drillsTried: 4, drills: 5 }),
    ).not.toContain("full-circuit");
    expect(
      earnedAchievements({ ...emptyStats, drillsTried: 5, drills: 5 }),
    ).toContain("full-circuit");
  });

  test("the veteran profile earns the expected set", () => {
    const earned = earnedAchievements({
      totalSessions: 40,
      totalMinutes: 75,
      bestOverall: 88,
      totalQuiz: 12,
      totalReframes: 6,
      totalResets: 11,
      streakDays: 8,
      drillsTried: 5,
      drills: 5,
    });
    expect(earned).toEqual([
      "first-word",
      "full-circuit",
      "week-streak",
      "high-score",
      "room-reader",
      "reframer",
      "deep-breaths",
      "ten-takes",
      "sixty-minutes",
    ]);
  });

  test("every achievement's predicate is satisfied by some achievable profile", () => {
    // Guard against impossible achievements (e.g. inverted comparisons).
    for (const a of ACHIEVEMENTS) {
      const generous: AchievementStats = {
        totalSessions: 999,
        totalMinutes: 999,
        bestOverall: 100,
        totalQuiz: 999,
        totalReframes: 999,
        totalResets: 999,
        streakDays: 99,
        drillsTried: 5,
        drills: 5,
      };
      expect(a.test(generous)).toBe(true);
    }
  });
});

describe("XP constants", () => {
  test("daily sweep bonus beats any single action", () => {
    expect(XP.dailySweep).toBeGreaterThan(XP.take);
  });
});
