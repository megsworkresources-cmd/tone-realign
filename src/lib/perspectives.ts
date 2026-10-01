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
    name: "What am I assuming?",
    idea: "You're filling in the blanks — some of what upsets you is guesswork, not fact.",
    question: "What am I assuming that I don't actually know?",
    seed: "Retell it using only what a camera would have recorded. See how much drama was yours.",
    color: "bg-sun",
  },
  {
    id: "their-day",
    name: "It's not about me",
    idea: "People snap when they're late, embarrassed, or overwhelmed — it usually isn't about you.",
    question: "What might this have nothing to do with me?",
    seed: "Name three pressures that could explain their words. They don't excuse it; they explain it.",
    color: "bg-mint",
  },
  {
    id: "next-year",
    name: "A year from now",
    idea: "Most things feel smaller with time. Today it feels huge — that feeling lies.",
    question: "How big will this be a year from now?",
    seed: "Write the one-line version you'd tell a friend next year. Usually one sentence, usually a shrug.",
    color: "bg-coral",
  },
  {
    id: "ally",
    name: "My biggest fan",
    idea: "Imagine your biggest fan watched this moment. What would they say you were doing?",
    question: "What would someone on my side say I was doing here?",
    seed: "\"You were protecting ___\" counts. Looking out for yourself can be both firm and kind.",
    color: "bg-paper",
  },
  {
    id: "stake",
    name: "What really matters",
    idea: "Ask what this is really about. Most conflict is one of two things: respect or closeness.",
    question: "What do I actually want to be true after this?",
    seed: "If it's respect, ask for it in one clear sentence. If it's closeness, same rule.",
    color: "bg-sun",
  },
];

/** Deterministic per-day lens rotation for the "lens of the day" chip. */
export function lensOfTheDay(day: number): Lens {
  return LENSES[day % LENSES.length];
}
