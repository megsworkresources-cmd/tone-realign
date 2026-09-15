import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * The daily checklist + XP ledger. One row per user per local day.
 * The server is the source of truth for completion and XP — clients can't
 * award themselves a streak.
 */

/** Days since local epoch, matching src/lib/daily.ts's dayNumber(). */
function localDayKey(): string {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = Math.floor(local.getTime() / 86_400_000);
  // Stable string form so indexes stay readable and sortable-ish.
  const d = new Date(day * 86_400_000);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** The four checklist actions and their XP. Mirrors src/lib/gamify.ts XP. */
const ACTION_XP: Record<string, number> = {
  take: 30,
  quiz: 15,
  reframe: 20,
  reset: 10,
  translate: 20,
};

/** Mark a daily action complete. Idempotent per day; awards XP once. */
export const mark = mutation({
  args: { action: v.union(v.literal("take"), v.literal("quiz"), v.literal("reframe"), v.literal("reset"), v.literal("translate")) },
  handler: async (ctx, { action }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const day = localDayKey();
    const existing = await ctx.db
      .query("dailyLog")
      .withIndex("by_user_day", (q) => q.eq("userId", user._id).eq("day", day))
      .unique();

    if (existing) {
      if (existing.completed.includes(action)) return existing._id;
      const completed = [...existing.completed, action];
      // Sweep bonus: the four core habits (translate excluded) in one day
      // pays an extra +40 once. Server-side count must match the client's
      // CHECKLIST_ACTIONS contract — translate awards XP but never sweeps.
      const swept =
        action !== "translate" &&
        completed.filter((c) => c !== "translate").length === 4;
      await ctx.db.patch(existing._id, {
        completed,
        xpEarned: existing.xpEarned + ACTION_XP[action] + (swept ? 40 : 0),
      });
      return existing._id;
    }

    return await ctx.db.insert("dailyLog", {
      userId: user._id,
      day,
      completed: [action],
      xpEarned: ACTION_XP[action],
    });
  },
});

/**
 * Add bonus XP outside the four actions (personal bests). Capped per call
 * so a client bug can't mint arbitrary XP; insert-only if today's row
 * doesn't exist yet.
 */
export const addBonus = mutation({
  args: { amount: v.number() },
  handler: async (ctx, { amount }) => {
    const user = await getCurrentUser(ctx);
    if (!user)    throw new Error("Not authenticated");
    const capped = Math.max(0, Math.min(60, Math.round(amount)));
    if (capped === 0) return;

    const day = localDayKey();
    const row = await ctx.db
      .query("dailyLog")
      .withIndex("by_user_day", (q) => q.eq("userId", user._id).eq("day", day))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { xpEarned: row.xpEarned + capped });
    } else {
      await ctx.db.insert("dailyLog", {
        userId: user._id,
        day,
        completed: [],
        xpEarned: capped,
      });
    }
  },
});

/**
 * One Read-the-Room scenario answered. Counts toward the lifetime quiz
 * total (achievements), plus the daily checklist credit once per day.
 */
export const countQuizScenario = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { quizCount: (user.quizCount ?? 0) + 1 });

    // Piggyback the daily checklist credit (mark is idempotent per day).
    const day = localDayKey();
    const row = await ctx.db
      .query("dailyLog")
      .withIndex("by_user_day", (q) => q.eq("userId", user._id).eq("day", day))
      .unique();
    if (row && !row.completed.includes("quiz")) {
      const completed = [...row.completed, "quiz"];
      // Same sweep contract as `mark`: the four core habits only.
      const swept = completed.filter((c) => c !== "translate").length === 4;
      await ctx.db.patch(row._id, {
        completed,
        xpEarned: row.xpEarned + ACTION_XP.quiz + (swept ? 40 : 0),
      });
    } else if (!row) {
      await ctx.db.insert("dailyLog", {
        userId: user._id,
        day,
        completed: ["quiz"],
        xpEarned: ACTION_XP.quiz,
      });
    }
  },
});

/** Today's checklist state (empty when nothing done yet). */
export const today = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { completed: [], xpEarned: 0, day: "" };

    const day = localDayKey();
    const row = await ctx.db
      .query("dailyLog")
      .withIndex("by_user_day", (q) => q.eq("userId", user._id).eq("day", day))
      .unique();
    return {
      completed: (row?.completed ?? []) as string[],
      xpEarned: row?.xpEarned ?? 0,
      day,
    };
  },
});

/**
 * Progression stats: lifetime XP from daily log + aggregate practice/quiz/
 * reframe/reset counts. One query so the header ring and achievement shelf
 * don't each re-walk the database.
 */
export const progression = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        totalXp: 0,
        todayCompleted: [] as string[],
        todayXp: 0,
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
    }

    const logs = await ctx.db
      .query("dailyLog")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const totalXp = logs.reduce((acc, l) => acc + l.xpEarned, 0);

    const day = localDayKey();
    const todayRow = logs.find((l) => l.day === day);
    const todayCompleted = (todayRow?.completed ?? []) as string[];

    const sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const reframeLogs = await ctx.db
      .query("reframeLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const attempts = await ctx.db
      .query("drillAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Streak: count dailyLog rows that form a consecutive run ending today
    // or yesterday (so an un-checked-in morning doesn't wipe yesterday's run).
    const daySet = new Set(logs.map((l) => l.day));
    let streakDays = 0;
    const msDay = 86_400_000;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let cursor = startOfDay;
    // Allow "today not yet logged" by starting the walk at today; if today is
    // missing, step to yesterday before counting.
    if (!daySet.has(dayKeyFor(cursor))) cursor -= msDay;
    while (daySet.has(dayKeyFor(cursor))) {
      streakDays++;
      cursor -= msDay;
    }

    const totalMs = sessions.reduce((acc, s) => acc + s.durationMs, 0);
    const bestOverall = attempts.reduce((acc, a) => Math.max(acc, a.bestScore), 0);

    // Last 7 local days of XP, oldest first ("S" style keys resolved client-side).
    const week: { day: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = dayKeyFor(startOfDay - i * msDay);
      week.push({ day: key, xp: logs.find((l) => l.day === key)?.xpEarned ?? 0 });
    }

    return {
      totalXp,
      todayCompleted,
      todayXp: todayRow?.xpEarned ?? 0,
      week,
      totalSessions: sessions.length,
      totalMinutes: Math.round(totalMs / 60_000),
      bestOverall,
      totalQuiz: user.quizCount ?? 0,
      totalReframes: reframeLogs.length,
      totalResets: logs.filter((l) => l.completed.includes("reset")).length,
      streakDays,
      drillsTried: attempts.length,
      drills: 5, // DRILLS.length — kept literal to avoid a client import in Convex
    };
  },
});

/** "YYYY-M-D" key for a UTC-ms timestamp at midnight local. */
function dayKeyFor(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
