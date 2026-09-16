import { BREATH_CUES, BREATH_LABELS, BREATH_SEQUENCE } from "./breath";

/**
 * The grounding kit — every calm-down exercise in one place, restored as
 * a full set: breath pacers (4-7-8, box, physiological sigh, quick
 * steady) and attention guides (5-4-3-2-1 senses, body scan).
 *
 * One generalized engine drives all of them: every exercise is a loop
 * of timed steps; the orb grows on "in", holds on "hold", drains on
 * "out", and idles mid-size on "settle" (attention steps). Pure logic —
 * the component just feeds it a ticking clock.
 */

export type GroundingKind = "in" | "hold" | "out" | "settle";

export interface GroundingStep {
  kind: GroundingKind;
  /** Seconds this step lasts within one round. */
  seconds: number;
  /** The instruction, short enough to read mid-exercise. */
  label: string;
  /** Coaching line shown under the label. */
  cue: string;
}

export interface GroundingExercise {
  id: string;
  name: string;
  /** One-line promise shown on the tab and under the name. */
  tag: string;
  /** Tailwind background utility for accents. */
  color: string;
  /** Lucide icon key — mapped in the component. */
  icon: "wind" | "box" | "waves" | "eye" | "scan" | "timer";
  /** Why this exists / when to reach for it. */
  intro: string;
  /** Suggested rounds — the kit marks progress against this. */
  rounds: number;
  steps: GroundingStep[];
}

/** One round of 4-7-8, reusing the breath lib's single source of truth. */
const BREATH_STEPS: GroundingStep[] = BREATH_SEQUENCE.map((s) => ({
  kind: s.phase,
  seconds: s.seconds,
  label: BREATH_LABELS[s.phase],
  cue: BREATH_CUES[s.phase],
}));

export const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: "reset-478",
    name: "The Reset (4·7·8)",
    tag: "Drop the shoulders, drop the pitch",
    color: "bg-mint",
    icon: "wind",
    intro:
      "The pre-take ritual. Long exhales tell your nervous system the threat passed — and your voice follows your body, not the other way round.",
    rounds: 3,
    steps: BREATH_STEPS,
  },
  {
    id: "box-breathing",
    name: "Box breathing",
    tag: "Even, square, unshakeable",
    color: "bg-sun",
    icon: "box",
    intro:
      "Four sides, four seconds each. The even rhythm is what Navy SEALs use under fire — steadier than 4-7-8 when you need alert calm, not sleepiness.",
    rounds: 4,
    steps: [
      { kind: "in", seconds: 4, label: "Breathe in", cue: "Through the nose, low into the belly." },
      { kind: "hold", seconds: 4, label: "Hold", cue: "Full but not strained." },
      { kind: "out", seconds: 4, label: "Breathe out", cue: "Slow and even — like tracing a line." },
      { kind: "hold", seconds: 4, label: "Hold", cue: "Empty and still. Nothing to do." },
    ],
  },
  {
    id: "physiological-sigh",
    name: "Physiological sigh",
    tag: "The fastest hard reset there is",
    color: "bg-coral",
    icon: "waves",
    intro:
      "Two inhales, one long exhale — the pattern your body uses automatically after crying. Two rounds and your heart rate measurably drops. Use it mid-conversation.",
    rounds: 4,
    steps: [
      { kind: "in", seconds: 3, label: "Breathe in", cue: "Big first sip through the nose." },
      { kind: "in", seconds: 2, label: "Top it up", cue: "Second short sniff to the very top." },
      { kind: "out", seconds: 8, label: "Long let-go", cue: "Everything out through the mouth, slow." },
    ],
  },
  {
    id: "quick-steady",
    name: "The 10-second steady",
    tag: "Between their sentence and yours",
    color: "bg-paper",
    icon: "timer",
    intro:
      "The in-the-moment move: one steady inhale, one longer exhale, right before you answer. It buys the pause that keeps your tone from matching theirs.",
    rounds: 5,
    steps: [
      { kind: "in", seconds: 4, label: "In for four", cue: "While they finish their sentence." },
      { kind: "out", seconds: 6, label: "Out for six", cue: "Speak on the tail of the exhale." },
    ],
  },
  {
    id: "senses-54321",
    name: "5·4·3·2·1 senses",
    tag: "Out of your head, into the room",
    color: "bg-sun",
    icon: "eye",
    intro:
      "Anxiety runs on the story in your head; attention runs on the room. Name what your senses actually find, and the spiral loses its footing.",
    rounds: 2,
    steps: [
      { kind: "settle", seconds: 20, label: "5 things you can see", cue: "Small ones count — a shadow, a seam." },
      { kind: "settle", seconds: 20, label: "4 things you can feel", cue: "Chair, fabric, floor, your own hands." },
      { kind: "settle", seconds: 20, label: "3 things you can hear", cue: "Farthest sound first, then nearer." },
      { kind: "settle", seconds: 10, label: "2 things you can smell", cue: "Or two smells you wish you could." },
      { kind: "settle", seconds: 10, label: "1 thing you can taste", cue: "Sip of water counts. Then exhale, slow." },
    ],
  },
  {
    id: "body-scan",
    name: "Unclench scan",
    tag: "Jaw, shoulders, hands — where tone starts",
    color: "bg-mint",
    icon: "scan",
    intro:
      "Tension lives in five places and each one tightens your voice. Sweep through them and release before the take — clarity comes from an unclenched jaw.",
    rounds: 2,
    steps: [
      { kind: "settle", seconds: 15, label: "Jaw", cue: "Unclench. Tongue off the roof of your mouth." },
      { kind: "settle", seconds: 15, label: "Shoulders", cue: "Let them fall. Feel them drop a full inch." },
      { kind: "settle", seconds: 15, label: "Hands", cue: "Open your palms. Soft fingers." },
      { kind: "settle", seconds: 15, label: "Stomach", cue: "Release the brace. Let the breath come low." },
      { kind: "settle", seconds: 15, label: "Feet", cue: "Press them into the floor. Grounded." },
    ],
  },
];

/** Cumulative ms offsets where each step starts within one round. */
export function groundingOffsets(ex: GroundingExercise): {
  step: GroundingStep;
  startMs: number;
  endMs: number;
}[] {
  let acc = 0;
  return ex.steps.map((step) => {
    const entry = { step, startMs: acc, endMs: acc + step.seconds * 1000 };
    acc += step.seconds * 1000;
    return entry;
  });
}

/** Length of one full round, in ms. */
export function groundingRoundMs(ex: GroundingExercise): number {
  return ex.steps.reduce((n, s) => n + s.seconds, 0) * 1000;
}

/** The whole suggested session, in ms. */
export function groundingTotalMs(ex: GroundingExercise): number {
  return groundingRoundMs(ex) * ex.rounds;
}

/**
 * Given elapsed ms, return the current step and how far through it (and
 * the round) we are. Pure — the component just feeds it a ticking clock.
 */
export function groundingStateAt(
  ex: GroundingExercise,
  elapsedMs: number,
): {
  stepIndex: number;
  step: GroundingStep;
  round: number; // 1-indexed
  progress: number;
  msLeftInStep: number;
} {
  const offsets = groundingOffsets(ex);
  const roundMs = groundingRoundMs(ex);
  const round = Math.floor(elapsedMs / roundMs) + 1;
  const within = elapsedMs % roundMs;
  const idx = Math.max(
    0,
    offsets.findIndex((o) => within >= o.startMs && within < o.endMs),
  );
  const current = offsets[idx] ?? offsets[offsets.length - 1];
  const span = current.endMs - current.startMs;
  const into = within - current.startMs;
  return {
    stepIndex: idx,
    step: current.step,
    round,
    progress: Math.min(1, Math.max(0, into / span)),
    msLeftInStep: span - into,
  };
}

/** Orb size per step kind: in = fill, hold = full, out = drain, settle = calm mid. */
export function orbScaleForStep(kind: GroundingKind, progress: number): number {
  if (kind === "in") return 0.55 + 0.45 * progress;
  if (kind === "hold") return 1;
  if (kind === "out") return 1 - 0.45 * progress;
  return 0.72; // settle — steady, gently present
}
