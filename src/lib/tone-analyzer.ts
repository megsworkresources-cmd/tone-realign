/**
 * Client-side voice tone analyzer.
 *
 * Captures the microphone with the Web Audio API and derives, in real time:
 *  - pitch (Hz) via time-domain autocorrelation
 *  - volume (RMS)
 *  - voiced/silence ratio, speaking pace estimate
 *
 * From these it computes coaching scores (0..100): calm, energy, clarity,
 * stability, and an overall score, plus a dominant tone label — including
 * how the delivery *lands* socially (irritated, passive-aggressive,
 * holding back, confused, suspicious) based on how pitch and pressure
 * drift across the take.
 */

export interface ToneFrame {
  pitchHz: number | null; // null when unvoiced
  volume: number; // RMS 0..1
  timestamp: number;
}

export interface ToneAnalysis {
  dominantTone: string;
  avgPitchHz: number;
  pitchRangeHz: number;
  avgVolume: number;
  volumeVariability: number;
  /** Relative drift of pitch across the take: (2nd-half mean − 1st-half mean) / 1st-half mean. */
  pitchTrend: number;
  /** Relative drift of volume across the take, same definition. */
  volumeTrend: number;
  wordsPerMinute: number;
  voicedRatio: number;
  calmScore: number;
  energyScore: number;
  clarityScore: number;
  stabilityScore: number;
  overallScore: number;
}

const MIN_PITCH = 60;
const MAX_PITCH = 400;
const WPM_ASSUMED_SYLLABLES_PER_WORD = 1.6;

/** Autocorrelation pitch detection on a time-domain buffer. Returns null if unvoiced. */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.015) return null; // silence / noise floor

  // Trim low-amplitude edges for a cleaner correlation window
  let start = 0;
  let end = size - 1;
  const threshold = 0.2;
  while (start < size / 2 && Math.abs(buffer[start]) < threshold) start++;
  while (end > size / 2 && Math.abs(buffer[end]) < threshold) end--;
  if (end - start < 2) return null;

  const window = buffer.slice(start, end);
  const n = window.length;
  const c = new Float32Array(n).fill(0);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += window[i] * window[i + lag];
    }
    c[lag] = sum;
  }

  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  if (maxPos <= 0) return null;

  let T0 = maxPos;
  // Parabolic interpolation around the peak for sub-sample accuracy
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const pitchHz = sampleRate / T0;
  if (pitchHz < MIN_PITCH || pitchHz > MAX_PITCH) return null;
  return pitchHz;
}

export interface AnalyzeOptions {
  /** Spoken-word estimate; when provided, WPM uses it instead of the syllable heuristic. */
  wordCount?: number;
}

/** Aggregate captured frames into a full analysis. */
export function analyzeFrames(
  frames: ToneFrame[],
  durationMs: number,
  options: AnalyzeOptions = {},
): ToneAnalysis {
  const pitches = frames
    .map((f) => f.pitchHz)
    .filter((p): p is number => p !== null);
  const volumes = frames.map((f) => f.volume);
  const voicedFrames = frames.filter((f) => f.pitchHz !== null).length;
  const voicedRatio = frames.length > 0 ? voicedFrames / frames.length : 0;

  const avgPitchHz =
    pitches.length > 0
      ? pitches.reduce((a, b) => a + b, 0) / pitches.length
      : 0;
  const pitchRangeHz =
    pitches.length > 1
      ? Math.max(...pitches) - Math.min(...pitches)
      : 0;

  const avgVolume =
    volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : 0;
  const volumeVariability =
    volumes.length > 1
      ? Math.sqrt(
          volumes.reduce(
            (acc, v) => acc + (v - avgVolume) * (v - avgVolume),
            0,
          ) / volumes.length,
        )
      : 0;

  // Relative pitch spread: tension and flatness both narrow it
  let pitchVariability = 0;
  if (pitches.length > 1) {
    const mean = avgPitchHz;
    pitchVariability =
      Math.sqrt(
        pitches.reduce((acc, p) => acc + (p - mean) * (p - mean), 0) /
          pitches.length,
      ) / mean;
  }

  // Delivery drift: how pitch and volume move from the first half of the
  // take to the second. Escalation, trailing off, and the quiet-with-rising-
  // pitch pattern all live here, not in the averages.
  const pitchTrend = splitHalfTrend(pitches);
  const volumeTrend = splitHalfTrend(volumes);

  // Speaking pace
  const durationSec = Math.max(durationMs / 1000, 1);
  let wordsPerMinute: number;
  if (options.wordCount && options.wordCount > 0) {
    wordsPerMinute = Math.round((options.wordCount / durationSec) * 60);
  } else {
    // Syllable-nucleus estimate: vowel centers show up as local energy peaks
    const estimatedSyllables = countSyllableNuclei(frames);
    wordsPerMinute = Math.round(
      (estimatedSyllables / WPM_ASSUMED_SYLLABLES_PER_WORD / durationSec) * 60,
    );
  }

  // ---- Scores (0..100) ----

  // Calm: moderate pace, not too loud, healthy voiced ratio
  const paceIdeal = 130; // wpm
  const pacePenalty = Math.min(Math.abs(wordsPerMinute - paceIdeal) / 90, 1);
  const volumePenalty = Math.min(Math.max(avgVolume - 0.25, 0) / 0.2, 1);
  const calmScore = Math.round(
    100 * (1 - 0.5 * pacePenalty - 0.3 * volumePenalty - 0.2 * (1 - voicedRatio)),
  );

  // Energy: pitch movement + volume presence (monotone reads low-energy)
  const rangeScore = Math.min(pitchRangeHz / 90, 1);
  const presenceScore = Math.min(avgVolume / 0.15, 1);
  const energyScore = Math.round(100 * (0.55 * rangeScore + 0.45 * presenceScore));

  // Clarity: steadiness of volume, adequate voicing, sane pace
  const steadyVolume = Math.min(volumeVariability / 0.09, 1); // lower = steadier
  const paceClarity = wordsPerMinute > 190 || wordsPerMinute < 70 ? 0.4 : 1;
  const clarityScore = Math.round(
    100 *
      (0.4 * (1 - Math.abs(steadyVolume - 0.35)) +
        0.35 * Math.min(voicedRatio / 0.6, 1) +
        0.25 * paceClarity),
  );

  // Stability: how consistently pitch holds (relative spread)
  const stabilityRaw = 1 - Math.min(pitchVariability / 0.35, 1);
  const stabilityScore = Math.round(
    100 * (voicedRatio > 0.15 ? stabilityRaw : 0.2),
  );

  // Tone label
  const dominantTone = labelTone({
    avgVolume,
    pitchVariability,
    wordsPerMinute,
    pitchRangeHz,
    voicedRatio,
    pitchTrend,
    volumeTrend,
  });

  const overallScore = Math.round(
    0.3 * calmScore +
      0.2 * energyScore +
      0.25 * clarityScore +
      0.25 * stabilityScore,
  );

  return {
    dominantTone,
    avgPitchHz: Math.round(avgPitchHz),
    pitchRangeHz: Math.round(pitchRangeHz),
    avgVolume: round2(avgVolume),
    volumeVariability: round2(volumeVariability),
    pitchTrend: round2(pitchTrend),
    volumeTrend: round2(volumeTrend),
    wordsPerMinute,
    voicedRatio: round2(voicedRatio),
    calmScore: clampScore(calmScore),
    energyScore: clampScore(energyScore),
    clarityScore: clampScore(clarityScore),
    stabilityScore: clampScore(stabilityScore),
    overallScore: clampScore(overallScore),
  };
}

/**
 * Relative drift of a per-frame value across the take: how much the second
 * half's mean differs from the first half's, as a fraction of the first.
 * Returns 0 for short captures where a trend would be noise.
 */
function splitHalfTrend(values: number[]): number {
  if (values.length < 8) return 0;
  const mid = Math.floor(values.length / 2);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const first = mean(values.slice(0, mid));
  const second = mean(values.slice(mid));
  const base = Math.max(Math.abs(first), 1e-6);
  return (second - first) / base;
}

function labelTone(m: {
  avgVolume: number;
  pitchVariability: number;
  wordsPerMinute: number;
  pitchRangeHz: number;
  voicedRatio: number;
  pitchTrend: number;
  volumeTrend: number;
}): string {
  if (m.voicedRatio < 0.12) return "quiet";
  const tense = m.pitchVariability > 0.22 && m.avgVolume > 0.12;
  const rushed = m.wordsPerMinute > 175;
  if (tense) return "tense";
  if (rushed) return "rushed";

  // How the delivery *lands* — the story the trends tell across the take.
  // Irritated: pitch and pressure climbing together as the take goes on.
  if (m.pitchTrend > 0.05 && m.volumeTrend > 0.15) return "irritated";
  // Passive-aggressive: pitch rising while volume fades — "fine, whatever."
  if (m.pitchTrend > 0.05 && m.volumeTrend < -0.05) return "passive-aggressive";
  // Holding back: the take audibly trails off — the end of the thought swallowed.
  if (m.volumeTrend < -0.2) return "holding-back";
  // Confused: quiet, searching pitch that wanders and drifts upward.
  if (m.pitchVariability > 0.18 && m.pitchTrend > 0.05 && m.avgVolume < 0.12) {
    return "confused";
  }
  // Suspicious: slow, measured, with pitch sinking — guarded delivery.
  if (m.wordsPerMinute < 110 && m.pitchTrend < -0.05 && m.pitchRangeHz < 60) {
    return "suspicious";
  }

  const flat = m.pitchRangeHz < 25 && m.pitchVariability < 0.08;
  if (flat) return "flat";
  if (m.wordsPerMinute >= 110 && m.pitchVariability >= 0.08) return "engaged";
  if (m.avgVolume > 0.02 && m.pitchVariability < 0.14) return "calm";
  return "mixed";
}

/**
 * Rough syllable count: vowel nuclei appear as local peaks in the volume
 * envelope. A ~200ms refractory window keeps one nucleus from counting twice.
 */
function countSyllableNuclei(frames: ToneFrame[]): number {
  const SYL_FLOOR = 0.04; // above silence, below voiced average
  const SYL_REFRACTORY = 2; // frames (~100ms) — allows fast speech up to ~6.7 syl/s
  let count = 0;
  let lastPeakAt = -Infinity;
  for (let i = 1; i < frames.length - 1; i++) {
    const v = frames[i].volume;
    if (v < SYL_FLOOR) continue;
    const isLocalMax = v >= frames[i - 1].volume && v > frames[i + 1].volume;
    if (isLocalMax && i - lastPeakAt > SYL_REFRACTORY) {
      count++;
      lastPeakAt = i;
    }
  }
  return Math.max(count, 1);
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Tone label + friendly description for display. */
export const TONE_LABELS: Record<
  string,
  { label: string; note: string; color: string }
> = {
  calm: {
    label: "CALM",
    note: "Steady pressure and even pacing. This is the baseline to return to.",
    color: "bg-mint text-ink",
  },
  engaged: {
    label: "ENGAGED",
    note: "Lively pitch movement and presence. Great for storytelling and buy-in.",
    color: "bg-sun text-ink",
  },
  tense: {
    label: "TENSE",
    note: "High pressure with sharp pitch swings. Exhale first, then speak.",
    color: "bg-coral text-ink",
  },
  rushed: {
    label: "RUSHED",
    note: "Fast pacing outruns your listener. Land the period. Then breathe.",
    color: "bg-coral text-ink",
  },
  irritated: {
    label: "IRRITATED",
    note: "Pitch and pressure climbed together — the take escalated as it went. Exhale, then restart at half the heat.",
    color: "bg-coral text-ink",
  },
  "passive-aggressive": {
    label: "PASSIVE-AGGRESSIVE",
    note: "Pitch rose while volume faded — the classic \"fine, whatever.\" Say the true sentence at one even level.",
    color: "bg-sun text-ink",
  },
  "holding-back": {
    label: "HOLDING BACK",
    note: "You trailed off — the end of the thought got swallowed. Finish sentences at the volume you started them.",
    color: "bg-paper text-ink",
  },
  confused: {
    label: "CONFUSED",
    note: "Quiet, wandering pitch that drifts upward. Pick your last word and land on it — certainty is mostly commitment.",
    color: "bg-secondary text-ink",
  },
  suspicious: {
    label: "SUSPICIOUS",
    note: "Slow, measured, with pitch sinking — you sound like you're checking someone. Let the final phrase lift a little.",
    color: "bg-secondary text-ink",
  },
  flat: {
    label: "FLAT",
    note: "Narrow pitch range reads as disengaged. Let key words rise.",
    color: "bg-paper text-ink",
  },
  quiet: {
    label: "QUIET",
    note: "Low signal — we could barely hear you. Speak into the mic directly.",
    color: "bg-paper text-ink",
  },
  mixed: {
    label: "MIXED",
    note: "Shifting between modes. Pick one intention for the whole take.",
    color: "bg-secondary text-ink",
  },
};
