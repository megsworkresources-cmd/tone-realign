/**
 * "Tone check" — a 60-second, three-question self-assessment that maps
 * the visitor's default-under-pressure to one of four archetypes, each
 * paired with the drill that trains its exact weakness. Interactive on
 * the landing page; no mic, no account needed.
 */

export type ToneArchetype = "matcher" | "absorber" | "fixer" | "fader";

export interface ToneCheckOption {
  text: string;
  archetype: ToneArchetype;
}

export interface ToneCheckQuestion {
  id: string;
  prompt: string;
  options: ToneCheckOption[];
}

export const TONE_CHECK: ToneCheckQuestion[] = [
  {
    id: "interrupted",
    prompt: "Someone cuts you off mid-sentence. You…",
    options: [
      { text: "Talk over them — my point deserves air", archetype: "matcher" },
      { text: "Go quiet and let them have the floor", archetype: "absorber" },
      { text: "Wait, then correct the record", archetype: "fixer" },
      { text: "Say “anyway—” and shrink the point to fit", archetype: "fader" },
    ],
  },
  {
    id: "blindsided",
    prompt: "“We need to talk.” No context. Your body immediately…",
    options: [
      { text: "Heats up — I'm ready to defend", archetype: "matcher" },
      { text: "Drops — I start planning my apology", archetype: "absorber" },
      { text: "Tightens — I start building the case", archetype: "fixer" },
      { text: "Fogs out — I rehearse excuses", archetype: "fader" },
    ],
  },
  {
    id: "unfair-feedback",
    prompt: "Feedback that feels unfair lands in your lap. First move?",
    options: [
      { text: "Push back on the spot", archetype: "matcher" },
      { text: "Thank them, then seethe for a week", archetype: "absorber" },
      { text: "Debate the details until they concede", archetype: "fixer" },
      { text: "Nod, change nothing, avoid them", archetype: "fader" },
    ],
  },
];

export interface ToneArchetypeInfo {
  name: string;
  /** The one-line diagnosis, written to feel seen — not judged. */
  read: string;
  /** The drill id that trains this archetype's exact weakness. */
  drillId: string;
  /** Why this drill, in one breath. */
  pairing: string;
  color: string;
}

export const ARCHETYPES: Record<ToneArchetype, ToneArchetypeInfo> = {
  matcher: {
    name: "The Matcher",
    read: "You match energy — loud gets louder, sharp gets sharper. Powerful when you choose it; costly when it chooses you.",
    drillId: "unruffled",
    pairing: "Un-Ruffled trains the gap between the jab and your reply — exactly where your reflex lives.",
    color: "bg-coral",
  },
  absorber: {
    name: "The Absorber",
    read: "You swallow it to keep the peace. The room stays calm; you don't. That debt comes due somewhere.",
    drillId: "steady-ground",
    pairing: "Steady Ground practices naming a fact without complaint — the sentence Absorbers never get to say.",
    color: "bg-sun",
  },
  fixer: {
    name: "The Fixer",
    read: "You win the argument and lose the room. Right on the merits, wrong on the temperature.",
    drillId: "warm-open",
    pairing: "Warm Open trains audible warmth — the channel you mute when you're busy being right.",
    color: "bg-mint",
  },
  fader: {
    name: "The Fader",
    read: "You shrink the sentence until it can't offend anyone — including you. Things resolve, but never really.",
    drillId: "firm-clear",
    pairing: "Firm & Clear is the level-ending, no-tail sentence that Faders practice apologizing around.",
    color: "bg-paper",
  },
};

/** Tally answers → winning archetype (ties break toward the earlier pick). */
export function scoreToneCheck(answers: ToneArchetype[]): ToneArchetype {
  const tally: Record<ToneArchetype, number> = {
    matcher: 0,
    absorber: 0,
    fixer: 0,
    fader: 0,
  };
  for (const a of answers) tally[a]++;
  let best: ToneArchetype = "matcher";
  let bestN = -1;
  (Object.keys(tally) as ToneArchetype[]).forEach((k) => {
    if (tally[k] > bestN) {
      best = k;
      bestN = tally[k];
    }
  });
  return best;
}
