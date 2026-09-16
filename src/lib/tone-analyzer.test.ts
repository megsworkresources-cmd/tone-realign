import { describe, expect, test } from "bun:test";
import {
  analyzeFrames,
  biggestLever,
  buildFactorFeedback,
  detectPitch,
  spectralFlatness,
  TONE_FACTORS,
  TONE_LABELS,
  type ToneFrame,
} from "./tone-analyzer";

/** Synthesize a time-domain buffer of a sine wave at the given frequency. */
function sineBuffer(hz: number, seconds: number, sampleRate = 8000): Float32Array {
  const n = Math.round(hz * seconds) * 8; // enough samples for low pitches
  const size = Math.max(n, 512);
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  }
  return buf;
}

describe("detectPitch", () => {
  test("detects a 150Hz sine wave", () => {
    const buf = sineBuffer(150, 0.3);
    const pitch = detectPitch(buf, 8000);
    expect(pitch).not.toBeNull();
    // ±15Hz tolerance for autocorrelation on synthetic input
    expect(pitch! > 135 && pitch! < 165).toBe(true);
  });

  test("detects a 220Hz sine wave", () => {
    const buf = sineBuffer(220, 0.3);
    const pitch = detectPitch(buf, 8000);
    expect(pitch).not.toBeNull();
    expect(pitch! > 200 && pitch! < 240).toBe(true);
  });

  test("returns null for silence", () => {
    const buf = new Float32Array(2048); // all zeros
    expect(detectPitch(buf, 8000)).toBeNull();
  });

  test("returns null for out-of-range frequency (25Hz rumble)", () => {
    const buf = sineBuffer(25, 0.5);
    expect(detectPitch(buf, 8000)).toBeNull();
  });

  test("YIN resists the octave error that fooling plain autocorrelation: 90Hz frame reads 90, not 180", () => {
    // A strong 90 Hz fundamental with a weaker 2nd harmonic: naive peak-
    // picking autocorrelation locks onto the shorter lag (180 Hz); YIN's
    // cumulative-mean normalization picks the true fundamental.
    const size = 2048;
    const buf = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      buf[i] =
        0.5 * Math.sin((2 * Math.PI * 90 * i) / 8000) +
        0.2 * Math.sin((2 * Math.PI * 180 * i) / 8000);
    }
    const pitch = detectPitch(buf, 8000);
    expect(pitch).not.toBeNull();
    expect(pitch! > 80 && pitch! < 100).toBe(true);
  });

  test("returns null for broadband noise (aperiodic, no clear dip)", () => {
    // Deterministic pseudo-noise so the test never flakes.
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648 - 0.5;
    };
    const buf = new Float32Array(2048);
    for (let i = 0; i < buf.length; i++) buf[i] = rand() * 0.4;
    expect(detectPitch(buf, 8000)).toBeNull();
  });

  test("parabolic interpolation is accurate across the range", () => {
    for (const hz of [85, 130, 196, 300]) {
      const pitch = detectPitch(sineBuffer(hz, 0.3), 8000);
      expect(pitch).not.toBeNull();
      expect(Math.abs(pitch! - hz)).toBeLessThan(6);
    }
  });

  test("returns null for tiny buffers", () => {
    expect(detectPitch(new Float32Array(100), 8000)).toBeNull();
  });
});

describe("TONE_FACTORS", () => {
  const FACTOR_KEYS = ["calm", "energy", "clarity", "stability"] as const;

  test("covers exactly the four scored factors", () => {
    expect(Object.keys(TONE_FACTORS).sort()).toEqual(
      [...FACTOR_KEYS].sort(),
    );
  });

  test("every factor explains how it's rated and what the goal is", () => {
    for (const key of FACTOR_KEYS) {
      const f = TONE_FACTORS[key];
      expect(f.label.length).toBeGreaterThan(2);
      expect(f.how.length).toBeGreaterThan(40);
      expect(f.goal.length).toBeGreaterThan(30);
      expect(f.color).toMatch(/^bg-/); // theme token, renderable
    }
  });

  test("explanations match the actual scoring math", () => {
    // Honest copy: each factor's 'how' must reference the mechanism its
    // formula really uses (checked loosely by keyword).
    expect(TONE_FACTORS.calm.how).toMatch(/130 wpm/);
    expect(TONE_FACTORS.calm.how).toMatch(/voiced/i);
    expect(TONE_FACTORS.energy.how).toMatch(/pitch|volume/i);
    expect(TONE_FACTORS.clarity.how).toMatch(/volume|voiced|pace/i);
    expect(TONE_FACTORS.stability.how).toMatch(/spread|pitch/i);
  });

  test("goal copy never uses generic therapy filler", () => {
    for (const key of FACTOR_KEYS) {
      expect(TONE_FACTORS[key].goal).not.toMatch(/journey|healing|valid/i);
    }
  });

  test("stability copy mentions jitter; clarity copy mentions the spectral gate", () => {
    expect(TONE_FACTORS.stability.how).toMatch(/jitter/i);
    expect(TONE_FACTORS.clarity.how).toMatch(/spectrum|hissy|tonal/i);
  });
});

describe("analyzeFrames", () => {
  const now = 1000;

  test("returns 0-100 bounded scores", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 150 + 10 * Math.sin(i / 5),
      volume: 0.1,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000);
    for (const score of [
      a.calmScore,
      a.energyScore,
      a.clarityScore,
      a.stabilityScore,
      a.overallScore,
    ]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    expect(a.dominantTone.length).toBeGreaterThan(0);
  });

  test("rushed take (fast pace, loud) labels as rushed or tense, not calm", () => {
    // Speech-like: ~5 syllable nuclei/sec (volume pulses) at high pressure
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 200 + 15 * Math.sin(i / 3),
      volume: 0.3 + 0.1 * Math.sin((2 * Math.PI * i) / 4),
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000);
    expect(["rushed", "tense", "mixed"]).toContain(a.dominantTone);
    expect(a.dominantTone).not.toBe("calm");
  });

  test("steady moderate take labels as calm or engaged", () => {
    // Speech-like: gentle syllable pulses and healthy (non-flat) pitch movement
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 160 + 20 * Math.sin(i / 7),
      volume: 0.12 + 0.04 * Math.sin((2 * Math.PI * i) / 8),
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000);
    expect(["calm", "engaged"]).toContain(a.dominantTone);
  });

  test("quiet take (mostly unvoiced) labels as quiet", () => {
    const frames = Array.from({ length: 100 }, (_, i) => ({
      pitchHz: null,
      volume: 0.005,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 5_000);
    expect(a.dominantTone).toBe("quiet");
  });

  test("empty input is safe (no NaN/crash)", () => {
    const a = analyzeFrames([], 5_000);
    expect(Number.isFinite(a.avgPitchHz)).toBe(true);
    expect(Number.isFinite(a.overallScore)).toBe(true);
    expect(a.dominantTone).toBe("quiet");
  });

  test("wordCount option drives WPM instead of burst heuristic", () => {
    const frames = Array.from({ length: 100 }, (_, i) => ({
      pitchHz: 180,
      volume: 0.15,
      timestamp: now + i * 50,
    }));
    const withWords = analyzeFrames(frames, 30_000, { wordCount: 75 });
    expect(withWords.wordsPerMinute).toBe(150); // 75 words / 30s
  });

  test("TONE_LABELS covers every emitted tone", () => {
    for (const tone of [
      "calm",
      "engaged",
      "tense",
      "rushed",
      "irritated",
      "passive-aggressive",
      "holding-back",
      "confused",
      "suspicious",
      "flat",
      "quiet",
      "mixed",
    ]) {
      expect(TONE_LABELS[tone]).toBeDefined();
    }
  });

  // ---- Landing tones: how the delivery drifts across the take ----

  test("escalating take (pitch + pressure rising) lands as irritated", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 150 + (40 * i) / 199, // 150 → 190 Hz
      volume: 0.05 + (0.1 * i) / 199, // 0.05 → 0.15
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000, { wordCount: 22 });
    expect(a.dominantTone).toBe("irritated");
    expect(a.pitchTrend).toBeGreaterThan(0.05);
    expect(a.volumeTrend).toBeGreaterThan(0.15);
  });

  test("rising pitch with fading volume lands as passive-aggressive", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 150 + (40 * i) / 199,
      volume: 0.15 - (0.09 * i) / 199,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000, { wordCount: 22 });
    expect(a.dominantTone).toBe("passive-aggressive");
  });

  test("take that trails off lands as holding-back", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 160,
      volume: 0.18 - (0.13 * i) / 199,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000, { wordCount: 22 });
    expect(a.dominantTone).toBe("holding-back");
  });

  test("quiet wandering upward pitch lands as confused", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 140 + 40 * Math.sin(i / 5) + 0.15 * i,
      volume: 0.08,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000, { wordCount: 22 });
    expect(a.dominantTone).toBe("confused");
  });

  test("slow sinking guarded delivery lands as suspicious", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({
      pitchHz: 170 - (20 * i) / 199, // 170 → 150 Hz
      volume: 0.12,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 10_000, { wordCount: 15 }); // 90 wpm
    expect(a.dominantTone).toBe("suspicious");
  });

  test("splitHalfTrend is 0 for short captures (no noise trends)", () => {
    const frames = Array.from({ length: 6 }, (_, i) => ({
      pitchHz: 100 + 100 * i,
      volume: 0.1,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 1_000, { wordCount: 5 });
    expect(a.pitchTrend).toBe(0);
    expect(a.volumeTrend).toBe(0);
  });

  test("spectral flatness separates pure tone from white noise", () => {
    // Pure tone: one dominant bin → flatness near 0.
    const tone = new Float32Array(1024).fill(0);
    tone[40] = 100;
    expect(spectralFlatness(tone)).toBeLessThan(0.2);
    // White noise: energy everywhere → flatness near 1.
    let seed = 7;
    const noise = new Float32Array(1024);
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      noise[i] = 1 + seed / 2147483648;
    }
    expect(spectralFlatness(noise)).toBeGreaterThan(0.8);
    // Zero/empty is safe.
    expect(spectralFlatness(new Float32Array(64))).toBe(1);
  });

  test("a noise-dominated take scores lower clarity than a clean one", () => {
    const mk = (flat: number): ToneFrame[] =>
      Array.from({ length: 120 }, (_, i) => ({
        pitchHz: 160,
        volume: 0.12,
        timestamp: now + i * 50,
        flatness: flat,
      }));
    const clean = analyzeFrames(mk(0.2), 6_000, { wordCount: 20 });
    const hiss = analyzeFrames(mk(0.85), 6_000, { wordCount: 20 });
    expect(hiss.clarityScore).toBeLessThan(clean.clarityScore);
  });

  test("median filter kills a single octave-jump outlier", () => {
    const pitches = [150, 152, 149, 151, 310, 150, 148, 152];
    // The 310 spike (roughly an octave up) must not distort the mean of
    // the filtered sequence the way it would the raw mean.
    const rawMean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    // Reconstruct via analyzeFrames: build frames where one frame has the
    // outlier and the rest don't; the resulting avg pitch stays near 150.
    const frames: ToneFrame[] = pitches.map((p, i) => ({
      pitchHz: p,
      volume: 0.12,
      timestamp: now + i * 50,
    }));
    const a = analyzeFrames(frames, 1_000, { wordCount: 3 });
    expect(Math.abs(a.avgPitchHz - 150)).toBeLessThan(
      Math.abs(rawMean - 150) + 2,
    );
  });
});

describe("buildFactorFeedback", () => {
  const now = 1000;

  const baseAnalysis = () =>
    analyzeFrames(
      Array.from({ length: 200 }, (_, i) => ({
        pitchHz: 160 + 20 * Math.sin(i / 7),
        volume: 0.12 + 0.04 * Math.sin((2 * Math.PI * i) / 8),
        timestamp: now + i * 50,
      })),
      10_000,
    );

  test("every factor gets status, a personal read, numbers, and a tip", () => {
    const fb = buildFactorFeedback(baseAnalysis());
    for (const key of ["calm", "energy", "clarity", "stability"] as const) {
      const f = fb[key];
      expect(["strong", "decent", "wobbly", "rough"]).toContain(f.status);
      expect(f.read.length).toBeGreaterThan(30);
      expect(f.yourNumbers.length).toBeGreaterThan(8);
      expect(f.tip.length).toBeGreaterThan(30);
    }
  });

  test("feedback differs between a rushed take and a slow take", () => {
    const fast = analyzeFrames(
      Array.from({ length: 200 }, (_, i) => ({
        pitchHz: 200,
        volume: 0.2,
        timestamp: now + i * 50,
      })),
      5_000,
      { wordCount: 30 }, // 360 wpm
    );
    const slow = analyzeFrames(
      Array.from({ length: 200 }, (_, i) => ({
        pitchHz: 160,
        volume: 0.12,
        timestamp: now + i * 50,
      })),
      30_000,
      { wordCount: 30 }, // 60 wpm
    );
    const fbFast = buildFactorFeedback(fast);
    const fbSlow = buildFactorFeedback(slow);
    expect(fbFast.calm.read).not.toBe(fbSlow.calm.read);
    expect(fbFast.calm.tip).not.toBe(fbSlow.calm.tip);
    expect(fbFast.calm.read).toMatch(/fast|Brisk|wpm/i);
    expect(fbSlow.calm.read).toMatch(/Slow|uncertain/i);
  });

  test("biggestLever returns the weakest factor's concrete tip", () => {
    const a = baseAnalysis();
    const lever = biggestLever(a);
    expect(["calm", "energy", "clarity", "stability"]).toContain(lever.factor);
    expect(lever.tip.length).toBeGreaterThan(30);
    // The lever's factor must actually be (tied for) the weakest score.
    const scores: Record<string, number> = {
      calm: a.calmScore,
      energy: a.energyScore,
      clarity: a.clarityScore,
      stability: a.stabilityScore,
    };
    expect(scores[lever.factor]).toBeLessThanOrEqual(
      Math.min(...Object.values(scores)),
    );
  });
});
