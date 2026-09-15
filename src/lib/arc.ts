/**
 * The 21-Day Reprogramming Arc — a structured three-week challenge that
 * gives return visits a spine: week one builds the floor (calm), week two
 * builds range (warmth/firmness), week three integrates (translation).
 * Pure data + helpers; the Dashboard shows the user's current day and stage.
 */

export interface ArcStage {
  id: string;
  name: string;
  /** Days covered, 1-indexed inclusive. */
  from: number;
  to: number;
  /** The theme, in the app's voice. */
  promise: string;
  /** The daily move for this stage. */
  move: string;
  /** Why this order — the through-line. */
  why: string;
}

export const ARC_STAGES: ArcStage[] = [
  {
    id: "floor",
    name: "The Floor",
    from: 1,
    to: 7,
    promise: "Calm you can stand on",
    move: "One Steady Ground take a day, plus the reset",
    why: "You can't pick a tone under pressure if calm isn't your default. Week one makes it the default.",
  },
  {
    id: "range",
    name: "The Range",
    from: 8,
    to: 14,
    promise: "Warmth and firmness on demand",
    move: "Alternate Warm Open and Firm & Clear; keep the daily reset",
    why: "With the floor under you, week two stretches the extremes — the two tones most people can't switch between.",
  },
  {
    id: "translate",
    name: "The Translation",
    from: 15,
    to: 21,
    promise: "Say it again the way you mean it",
    move: "One Translation Drill a day, any second drill you like",
    why: "The last week connects the training to real sentences — the ones you actually have to say.",
  },
];

export const ARC_LENGTH = 21;

/** The stage for a given day (clamps to the last stage past day 21). */
export function arcStageFor(day: number): ArcStage {
  const d = Math.max(1, Math.min(ARC_LENGTH, day));
  return ARC_STAGES.find((s) => d >= s.from && d <= s.to) ?? ARC_STAGES[ARC_STAGES.length - 1];
}

/** Days remaining in the arc (0 once finished). */
export function arcDaysLeft(day: number): number {
  return Math.max(0, ARC_LENGTH - Math.max(0, day));
}
