/**
 * Perspective lenses — the freedom tool in the Reframe Lab. A narrow
 * perception says "there is one obvious reading of what happened."
 * These lenses are five deliberate, legitimate ways the same moment
 * reads differently — none of them denial, all of them true.
 */

export interface Lens {
  id: string;
  name: string;
  /** The lens in one line. */
  idea: string;
  /** The question you ask while looking through it. */
  question: string;
  /** A nudge for what tends to surface through this lens. */
  seed: string;
  /** Tailwind bg utility for the card accent. */
  color: string;
}

export const LENSES: Lens[] = [
  {
    id: "author",
    name: "The Author",
    idea: "You're writing the story of this moment — with more confidence than the facts deserve.",
    question: "What details am I adding that I don't actually know?",
    seed: "Rewrite it with only what a camera would record. Notice how much drama was yours.",
    color: "bg-sun",
  },
  {
    id: "their-day",
    name: "Their Day",
    idea: "You've been in their position — running late, embarrassed, scared, overwhelmed — and it leaked out sideways.",
    question: "What might this have nothing to do with me?",
    seed: "Name three other pressures that could produce the exact same words. They don't excuse it; they explain it.",
    color: "bg-mint",
  },
  {
    id: "next-year",
    name: "Next Year",
    idea: "Most spikes flatten with distance. The brain treats now like forever — it isn't.",
    question: "How big is this from twelve months out?",
    seed: "Write the one-line version of this you'd tell a friend next year. Usually one sentence, usually a shrug.",
    color: "bg-coral",
  },
  {
    id: "ally",
    name: "The Ally",
    idea: "The kindest reader of your behavior isn't a pushover — they just refuse the uncharitable draft.",
    question: "What would someone on my side say I was doing here?",
    seed: "\"You were protecting ___\" is a legitimate sentence. Fierce and warm can be the same move.",
    color: "bg-paper",
  },
  {
    id: "stake",
    name: "The Stake",
    idea: "Zoom out on what's actually being decided. Most conflicts are about status or care — name yours.",
    question: "What do I actually want to be true after this?",
    seed: "If the answer is \"respect,\" ask for it in a sentence that can be granted. If it's \"closeness,\" same rule.",
    color: "bg-sun",
  },
];

/** Deterministic per-day lens rotation for the "lens of the day" chip. */
export function lensOfTheDay(day: number): Lens {
  return LENSES[day % LENSES.length];
}
