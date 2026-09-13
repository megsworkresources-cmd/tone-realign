import { describe, expect, test } from "bun:test";
import {
  BREATH_LABELS,
  BREATH_SEQUENCE,
  BREATH_TOTAL_MS,
  breathStateAt,
  orbScaleFor,
  phaseOffsets,
} from "./breath";

describe("breath sequence", () => {
  test("is the classic 4-7-8", () => {
    expect(BREATH_SEQUENCE.map((s) => s.seconds)).toEqual([4, 7, 8]);
    expect(Object.keys(BREATH_LABELS)).toEqual(["in", "hold", "out"]);
    expect(BREATH_TOTAL_MS).toBe(19_000);
  });

  test("phase offsets tile the round exactly, no gaps or overlaps", () => {
    const offsets = phaseOffsets();
    expect(offsets[0].startMs).toBe(0);
    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i].startMs).toBe(offsets[i - 1].endMs);
    }
    expect(offsets[offsets.length - 1].endMs).toBe(BREATH_TOTAL_MS);
  });
});

describe("breathStateAt", () => {
  test("starts in 'in' at t=0", () => {
    const s = breathStateAt(0);
    expect(s.phase).toBe("in");
    expect(s.round).toBe(1);
    expect(s.progress).toBe(0);
  });

  test("transitions at exact boundaries", () => {
    expect(breathStateAt(3_999).phase).toBe("in");
    expect(breathStateAt(4_000).phase).toBe("hold");
    expect(breathStateAt(11_000).phase).toBe("out");
    expect(breathStateAt(18_999).phase).toBe("out");
  });

  test("round 2 starts after 19s and counts up", () => {
    const s = breathStateAt(19_500);
    expect(s.round).toBe(2);
    expect(s.phase).toBe("in");
    expect(s.progress).toBeGreaterThan(0);
    expect(s.progress).toBeLessThan(1);
  });

  test("progress and msLeft always sum to the phase span", () => {
    for (let t = 0; t < 40_000; t += 137) {
      const s = breathStateAt(t);
      const span =
        BREATH_SEQUENCE.find((x) => x.phase === s.phase)!.seconds * 1000;
      expect(Math.round(s.progress * span) + s.msLeftInPhase).toBe(span);
    }
  });

  test("wraps cleanly across many rounds (25s, 30s, 60s)", () => {
    expect(breathStateAt(25_000).phase).toBe("hold"); // 25-19=6s → hold
    expect(breathStateAt(30_000).phase).toBe("out"); // 30-19=11s → out starts
    const s60 = breathStateAt(60_000);
    expect(s60.round).toBe(4); // 60/19 = 3.15 → round 4
  });
});

describe("orbScaleFor", () => {
  test("fills during 'in', holds at 1, drains during 'out'", () => {
    expect(orbScaleFor("in", 0)).toBeCloseTo(0.55);
    expect(orbScaleFor("in", 1)).toBeCloseTo(1);
    expect(orbScaleFor("hold", 0.5)).toBe(1);
    expect(orbScaleFor("out", 0)).toBeCloseTo(1);
    expect(orbScaleFor("out", 1)).toBeCloseTo(0.55);
  });

  test("never leaves the 0.55–1 band", () => {
    for (let p = 0; p <= 10; p++) {
      const v = orbScaleFor("in", p / 10);
      expect(v).toBeGreaterThanOrEqual(0.55);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
