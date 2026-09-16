import { describe, expect, test } from "bun:test";
import {
  GROUNDING_EXERCISES,
  groundingOffsets,
  groundingRoundMs,
  groundingStateAt,
  groundingTotalMs,
  orbScaleForStep,
  type GroundingExercise,
} from "./grounding";
import { BREATH_SEQUENCE, BREATH_TOTAL_MS } from "./breath";

const byId = new Map(GROUNDING_EXERCISES.map((e) => [e.id, e]));
const reset = byId.get("reset-478")!;
const box = byId.get("box-breathing")!;
const sigh = byId.get("physiological-sigh")!;
const steady = byId.get("quick-steady")!;
const senses = byId.get("senses-54321")!;
const scan = byId.get("body-scan")!;

describe("grounding catalog", () => {
  test("restores the full set — six exercises across breath + attention", () => {
    expect(GROUNDING_EXERCISES.map((e) => e.id)).toEqual([
      "reset-478",
      "box-breathing",
      "physiological-sigh",
      "quick-steady",
      "senses-54321",
      "body-scan",
    ]);
    const kinds = new Set(GROUNDING_EXERCISES.flatMap((e) => e.steps.map((s) => s.kind)));
    expect(kinds.has("settle")).toBe(true); // attention guides present
    expect(kinds.has("in")).toBe(true); // breath pacers present
  });

  test("every exercise is complete: unique ids, substantive copy, sane timing", () => {
    const ids = new Set(GROUNDING_EXERCISES.map((e) => e.id));
    expect(ids.size).toBe(GROUNDING_EXERCISES.length);
    for (const ex of GROUNDING_EXERCISES) {
      expect(ex.name.length).toBeGreaterThan(3);
      expect(ex.tag.length).toBeGreaterThan(3);
      expect(ex.intro.length).toBeGreaterThan(40);
      expect(ex.rounds).toBeGreaterThanOrEqual(1);
      expect(ex.steps.length).toBeGreaterThanOrEqual(2);
      for (const s of ex.steps) {
        expect(s.seconds).toBeGreaterThanOrEqual(2);
        expect(s.seconds).toBeLessThanOrEqual(30);
        expect(s.label.length).toBeGreaterThan(2);
        expect(s.cue.length).toBeGreaterThan(10);
      }
    }
  });

  test("the 4-7-8 exercise reuses the breath lib exactly (single source of truth)", () => {
    expect(reset.steps.map((s) => [s.kind, s.seconds])).toEqual(
      BREATH_SEQUENCE.map((s) => [s.phase, s.seconds]),
    );
    expect(groundingRoundMs(reset)).toBe(BREATH_TOTAL_MS);
  });
});

describe("offsets tile every round exactly", () => {
  test("no gaps or overlaps across all exercises", () => {
    for (const ex of GROUNDING_EXERCISES) {
      const offsets = groundingOffsets(ex);
      expect(offsets[0].startMs).toBe(0);
      for (let i = 1; i < offsets.length; i++) {
        expect(offsets[i].startMs).toBe(offsets[i - 1].endMs);
      }
      expect(offsets[offsets.length - 1].endMs).toBe(groundingRoundMs(ex));
    }
  });

  test("round lengths: 19s reset, 16s box, 13s sigh, 10s steady, 80s senses, 75s scan", () => {
    expect(groundingRoundMs(reset)).toBe(19_000);
    expect(groundingRoundMs(box)).toBe(16_000);
    expect(groundingRoundMs(sigh)).toBe(13_000);
    expect(groundingRoundMs(steady)).toBe(10_000);
    expect(groundingRoundMs(senses)).toBe(80_000);
    expect(groundingRoundMs(scan)).toBe(75_000);
    // Full sessions stay in a reasonable range: 30s–4min.
    for (const ex of GROUNDING_EXERCISES) {
      expect(groundingTotalMs(ex)).toBeGreaterThanOrEqual(30_000);
      expect(groundingTotalMs(ex)).toBeLessThanOrEqual(4 * 60_000);
    }
  });
});

describe("groundingStateAt", () => {
  test("reset: starts on 'in', transitions at boundaries, counts rounds", () => {
    expect(groundingStateAt(reset, 0).step.kind).toBe("in");
    expect(groundingStateAt(reset, 3_999).step.kind).toBe("in");
    expect(groundingStateAt(reset, 4_000).step.kind).toBe("hold");
    expect(groundingStateAt(reset, 11_000).step.kind).toBe("out");
    expect(groundingStateAt(reset, 19_500).round).toBe(2);
  });

  test("box: fourth step is the empty hold", () => {
    const s = groundingStateAt(box, 13_000); // after in+hold+out = 12s
    expect(s.stepIndex).toBe(3);
    expect(s.step.kind).toBe("hold");
  });

  test("sigh: two stacked inhales then the long exhale", () => {
    expect(groundingStateAt(sigh, 0).stepIndex).toBe(0);
    expect(groundingStateAt(sigh, 3_000).stepIndex).toBe(1); // top-up
    expect(groundingStateAt(sigh, 5_000).step.kind).toBe("out");
    expect(groundingStateAt(sigh, 8_000).step.seconds).toBe(8);
  });

  test("senses: attention steps advance by exact seconds (multi-minute safe)", () => {
    expect(groundingStateAt(senses, 0).step.label).toContain("5 things");
    expect(groundingStateAt(senses, 20_000).step.label).toContain("4 things");
    expect(groundingStateAt(senses, 70_000).step.label).toContain("1 thing");
    // Round 2, step 1 (80s + 5s)
    const s = groundingStateAt(senses, 85_000);
    expect(s.round).toBe(2);
    expect(s.stepIndex).toBe(0);
  });

  test("progress and msLeft always sum to the step span (sampled sweep)", () => {
    for (const ex of GROUNDING_EXERCISES) {
      const total = groundingTotalMs(ex);
      for (let t = 0; t <= Math.min(total, 200_000); t += 977) {
        const s = groundingStateAt(ex, t);
        const span = s.step.seconds * 1000;
        expect(Math.round(s.progress * span) + s.msLeftInStep).toBe(span);
      }
    }
  });
});

describe("orbScaleForStep", () => {
  test("fills on in, holds at 1, drains on out, idles on settle", () => {
    expect(orbScaleForStep("in", 0)).toBeCloseTo(0.55);
    expect(orbScaleForStep("in", 1)).toBeCloseTo(1);
    expect(orbScaleForStep("hold", 0.5)).toBe(1);
    expect(orbScaleForStep("out", 1)).toBeCloseTo(0.55);
    expect(orbScaleForStep("settle", 0)).toBe(0.72);
    expect(orbScaleForStep("settle", 0.9)).toBe(0.72);
  });

  test("stays in the 0.55–1 band for every kind and progress", () => {
    for (const kind of ["in", "hold", "out", "settle"] as const) {
      for (let p = 0; p <= 10; p++) {
        const v = orbScaleForStep(kind, p / 10);
        expect(v).toBeGreaterThanOrEqual(0.55);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("breath pacer stays the single 4-7-8 source (regression)", () => {
  test("no exercise drifts from the breath lib's sequence", () => {
    const exercisesWithBreath = GROUNDING_EXERCISES.filter((e) =>
      e.steps.some((s) => s.kind !== "settle"),
    );
    for (const ex of exercisesWithBreath as GroundingExercise[]) {
      // Every non-settle exercise must be internally consistent: offsets tile,
      // round length = sum of steps, totals = rounds × round.
      const sum = ex.steps.reduce((n, s) => n + s.seconds, 0) * 1000;
      expect(groundingRoundMs(ex)).toBe(sum);
      expect(groundingTotalMs(ex)).toBe(sum * ex.rounds);
    }
  });
});
