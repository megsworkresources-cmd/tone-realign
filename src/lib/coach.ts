/**
 * The V1 reframe coach — pure logic only.
 *
 * The product premise: the coach's value is being ANCHORED TO THE USER'S OWN
 * NUMBERS (their pace, pitch movement, stability), not generic advice. So the
 * prompt puts their real metrics in, the validator keeps the reply short and
 * specific, and if the LLM is unavailable a deterministic fallback still cites
 * their actual numbers. No therapy-speak anywhere — the coach is about
 * *sounding* calibrated, so it must sound calibrated.
 *
 * Everything here is pure and unit-tested; `src/convex/coach.ts` wires it to
 * the LLM and the database.
 */

export interface CoachTakeInput {
  drillName: string;
  /** What the drill was training, e.g. "Firm isn't loud. No apologetic tail." */
  focus: string;
  durationSec: number;
  dominantTone: string;
  overallScore: number;
  calmScore: number;
  energyScore: number;
  clarityScore: number;
  stabilityScore: number;
  avgPitchHz: number;
  pitchRangeHz: number;
  wordsPerMinute: number;
  voicedRatio: number;
  volumeVariability: number;
  /** Web Speech transcript of the take, when the browser supports it. */
  transcript?: string;
  /** The user's own context: what the take was responding to or opening. */
  context?: string;
  /** The user's own stated intention for the take. */
  goal?: string;
  /** Their best overall score on this drill, when they have one. */
  previousBest?: number;
}

export interface CoachReply {
  /** 2–3 sentences of specific, number-anchored feedback. */
  feedback: string;
  /** The single micro-suggestion for the next take (≤ ~12 words). */
  oneThing: string;
}

export const COACH_SYSTEM_PROMPT = `You are the ShiftedTone coach. You receive the measured numbers from one practice take (pace, pitch, scores) and what the person was practicing. Your job: tell them the ONE thing to change next take, anchored to THEIR numbers.

Hard rules:
- 2-3 sentences, under 60 words total. Brevity is the product.
- Cite at least one of their real numbers ("your pace hit 186 wpm", "only 14 Hz of pitch movement").
- If they gave context about the moment (who the take was aimed at, what it was responding to), tie the advice to that moment — the same pace reads as calm in an apology and as curt in a boundary.
- Give exactly one actionable instruction. Never a list.
- Coach voice: direct, warm, concrete — like someone who watched the tape. "Your pace spiked" not "Consider exploring pacing".
- BANNED: praise openers, therapy-speak ("I hear you", "that's valid", "you're doing amazing"), hedging, exclamation marks, emoji.
- If the take is strong, say so in five words or fewer and still give one refinement.

Reply with STRICT JSON only (no markdown fences), shaped exactly:
{"feedback": "2-3 sentences citing their numbers", "oneThing": "the single move for next take, under 12 words"}

Examples of the required voice:

User numbers: pace 188 wpm, tone rushed, voiced 61%, overall 58.
{"feedback": "Your pace hit 188 wpm — the words were calm but the tempo argued. At that speed listeners track the hurry, not the point. Take the final sentence at 150 and let it land.","oneThing": "Last sentence at 150 wpm"}

User numbers: pitch range 14 Hz, tone flat, stability 82, overall 71.
{"feedback": "Only 14 Hz of pitch movement across the whole take — that flatness makes good words sound rehearsed. Stability was solid at 82, so the foundation is there. Lift the one word you most want remembered.","oneThing": "Lift one key word"}`;

/** Compact, number-forward user message for the LLM. */
export function buildCoachUserContent(t: CoachTakeInput): string {
  const lines = [
    `Drill: ${t.drillName} (trains: ${t.focus})`,
    `Take: ${Math.round(t.durationSec)}s, read as "${t.dominantTone}"`,
    `Scores (0-100): overall ${t.overallScore}, calm ${t.calmScore}, energy ${t.energyScore}, clarity ${t.clarityScore}, stability ${t.stabilityScore}`,
    `Numbers: pace ${t.wordsPerMinute} wpm, pitch ${t.avgPitchHz} Hz avg (moved ${t.pitchRangeHz} Hz), voiced ${Math.round(t.voicedRatio * 100)}%, volume variability ${t.volumeVariability}`,
    t.transcript
      ? `What they said: "${t.transcript.slice(0, 600)}"`
      : "No transcript — coach from the numbers only.",
  ];
  if (t.context) {
    lines.push(
      `Their context — what this take was responding to or opening: "${t.context.slice(0, 400)}"`,
    );
  }
  if (t.previousBest !== undefined) {
    lines.push(`Their previous best on this drill: ${t.previousBest}.`);
  }
  if (t.goal) {
    lines.push(`What they were working on: "${t.goal.slice(0, 200)}"`);
  }
  return lines.join("\n");
}

/** Strip model dressing: markdown, fences, smart-quote wraps, extra whitespace. */
export function sanitizeCoachText(raw: string, maxLen = 480): string {
  const cleaned = raw
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, "");
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen - 1).trimEnd() + "…" : cleaned;
}

/**
 * Parse + validate a raw LLM completion into a CoachReply.
 * Returns null when the reply isn't usable (caller falls back).
 */
export function validateCoachReply(raw: string): CoachReply | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: { feedback?: unknown; oneThing?: unknown };
  try {
    parsed = JSON.parse(match[0]) as typeof parsed;
  } catch {
    return null;
  }
  if (typeof parsed.feedback !== "string") return null;
  const feedback = sanitizeCoachText(parsed.feedback);
  if (feedback.length < 20) return null;
  const oneThing =
    typeof parsed.oneThing === "string" ? sanitizeCoachText(parsed.oneThing, 120) : "";
  return { feedback, oneThing };
}

export type WeakestSignal =
  | "pace"
  | "pitch range"
  | "stability"
  | "clarity"
  | "calm"
  | "energy";

/** Deterministic pick of the most coachable signal in the take. */
export function pickWeakestSignal(t: CoachTakeInput): WeakestSignal {
  if (t.wordsPerMinute > 175) return "pace";
  if (t.pitchRangeHz < 25) return "pitch range";
  const scores: [WeakestSignal, number][] = [
    ["stability", t.stabilityScore],
    ["clarity", t.clarityScore],
    ["calm", t.calmScore],
    ["energy", t.energyScore],
  ];
  scores.sort((a, b) => a[1] - b[1]);
  return scores[0][0];
}

/**
 * Offline coach: anchored to their numbers, same voice as the LLM prompt.
 * Used when the LLM call fails or returns garbage — a free take never dies
 * on an API error.
 */
export function fallbackCoachNote(t: CoachTakeInput): CoachReply {
  const signal = pickWeakestSignal(t);
  const voiced = Math.round(t.voicedRatio * 100);
  let feedback: string;
  let oneThing: string;
  switch (signal) {
    case "pace":
      feedback = `Your pace landed at ${t.wordsPerMinute} wpm — past the line where listeners start tracking the hurry instead of the point. The fix is one sentence long: take the last one slower. Speak it at about ${Math.max(Math.round(t.wordsPerMinute * 0.8), 110)} and let the final word arrive late.`;
      oneThing = "Final sentence at 80% of that pace";
      break;
    case "pitch range":
      feedback = `Only ${t.pitchRangeHz} Hz of pitch movement across ${Math.round(t.durationSec)} seconds — that's the flatness that makes true words sound rehearsed. Pick the one word that matters most in what you said and let it rise a step. Everything else can stay exactly where it was.`;
      oneThing = "Let one key word rise";
      break;
    case "stability":
      feedback = `Stability scored ${t.stabilityScore}/100 — your pitch wandered between points instead of choosing spots. Decide your ending pitch before you start, and land on it rather than trailing off. Trailing is the sound of asking permission.`;
      oneThing = "Choose the ending pitch, land on it";
      break;
    case "clarity":
      feedback = `Clarity is your soft spot this take (${t.clarityScore}/100) — pressure wobbled more than the words did, with volume variability at ${t.volumeVariability}. Keep your last three words at the same force as your first three. Endings are what people repeat to themselves.`;
      oneThing = "Hold volume even through the last three words";
      break;
    case "calm":
      feedback = `Calm came in at ${t.calmScore}/100 — pace and pressure crept up together, and you were voiced only ${voiced}% of the take. Breathe in before the first sentence and speak on the exhale. The whole take inherits that first breath.`;
      oneThing = "First sentence on the exhale";
      break;
    case "energy":
      feedback = `Energy scored ${t.energyScore}/100 — the take is controlled but it's sitting in one gear. Let one genuine reaction reach your voice, not just your word choice. Presence is a sound before it's a fact.`;
      oneThing = "Let one real reaction reach your voice";
      break;
  }
  return { feedback, oneThing };
}
