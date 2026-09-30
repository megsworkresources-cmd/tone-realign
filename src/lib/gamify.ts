/**
 * The progression engine — XP, levels, and the daily checklist.
 * Pure logic: no React, no Convex. The server computes the same numbers with
 * these same constants, so the UI can never drift from the backend.
 */

export type DailyActionId = "take" | "quiz" | "reframe" | "reset" | "translate";

export interface DailyActionDef {
  id: DailyActionId;
  label: string;
  detail: string;
  xp: number;
}

/** XP for each action. Mirrored in convex/dailyLog.ts — keep in sync. */
export const XP = {
  take: 30,
  quiz: 15,
  reframe: 20,
  reset: 10,
  translate: 20,
  personalBest: 25,
  dailySweep: 40,
} as const;

export const DAILY_ACTIONS: DailyActionDef[] = [
  { id: "take", label: "One honest take", detail: "Any drill, mic on", xp: XP.take },
  { id: "quiz", label: "Read the Room", detail: "One scenario judged", xp: XP.quiz },
  { id: "reframe", label: "Reframe something", detail: "One trigger rewritten", xp: XP.reframe },
  { id: "reset", label: "Take the reset", detail: "One 4-7-8 round set", xp: XP.reset },
];

/**
 * The daily checklist is intentionally the four core habits — `translate`
 * awards its own XP but does not count toward the sweep, so the checklist
 * stays a fixed 4-slot contract (the server sweep math depends on it).
 */
export const CHECKLIST_ACTIONS: DailyActionId[] = DAILY_ACTIONS.map((a) => a.id);

/** Percentage of the daily checklist completed (0..100). */
export function dailyProgressPct(completed: DailyActionId[]): number {
  const done = new Set(completed.filter((c): c is DailyActionId => CHECKLIST_ACTIONS.includes(c as DailyActionId)));
  return Math.round((done.size / CHECKLIST_ACTIONS.length) * 100);
}

// ---- Levels ----

const LEVELS = [
  { label: "Warm-Up", min: 0 },
  { label: "Steady Hand", min: 150 },
  { label: "Clear Signal", min: 400 },
  { label: "Cool Head", min: 800 },
  { label: "Calibrated", min: 1400 },
  { label: "Room Reader", min: 2200 },
  { label: "Signature Tone", min: 3200 },
  { label: "Gravitas", min: 4600 },
] as const;

export interface LevelInfo {
  level: number;
  label: string;
  /** XP earned inside the current level band. */
  into: number;
  /** Width of the current band (0 at max level). */
  needed: number;
  progressPct: number;
  xpToNext: number;
  nextLabel?: string;
  maxed: boolean;
}

export function levelInfo(totalXp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].min) idx = i;
  }
  const next = LEVELS[idx + 1];
  const current = LEVELS[idx].min;
  const needed = next ? next.min - current : 0;
  const into = totalXp - current;
  return {
    level: idx + 1,
    label: LEVELS[idx].label,
    into,
    needed,
    progressPct: next ? Math.min(100, Math.round((into / needed) * 100)) : 100,
    xpToNext: next ? Math.max(0, next.min - totalXp) : 0,
    nextLabel: next?.label,
    maxed: !next,
  };
}
