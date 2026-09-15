/**
 * "The Translation Drill" — the core reprogramming exercise. Take a real
 * sentence that tends to come out wrong (snippy, apologetic, passive) and
 * say it again the way you actually mean it. The mic scores the *same
 * words* twice, so the only variable is you.
 */

export interface TranslationLine {
  id: string;
  /** The sentence, exactly as it tends to come out under pressure. */
  text: string;
  /** How it usually lands when said reflexively. */
  usually: string;
  /** What the intended version sounds like — the user's target. */
  intended: string;
  /** The tone the retake should chase (drives the target-tone hint). */
  targetHint: string;
  /** What the listener stops doing once it's said right. */
  payoff: string;
}

export const TRANSLATION_LINES: TranslationLine[] = [
  {
    id: "no",
    text: "No, I can't take that on right now.",
    usually: "Comes out apologetic — “sorry, sorry, I just have so much…” — and the no negotiates itself.",
    intended: "Even, warm, finished. A no with no apology tax attached.",
    targetHint: "Land the period. Don't trail the last word.",
    payoff: "The listener stops looking for the loophole.",
  },
  {
    id: "late",
    text: "I'm running about fifteen minutes behind.",
    usually: "Comes out breathless — “OH MY GOD I'm the WORST, I'm so sorry—” — and the panic becomes the story.",
    intended: "Calm, specific, unbothered. Information, not self-flagellation.",
    targetHint: "Slow the first three words; the rest follows.",
    payoff: "The listener relaxes instead of managing your guilt.",
  },
  {
    id: "disagree",
    text: "I see it differently.",
    usually: "Comes out either a challenge — “well, ACTUALLY…” — or a mumble that apologizes for existing.",
    intended: "Steady and undefended. A difference stated as weather, not war.",
    targetHint: "Keep volume level; let the sentence end low and solid.",
    payoff: "The listener hears a colleague, not an opponent.",
  },
  {
    id: "hurt",
    text: "That comment stung a little.",
    usually: "Comes out as a joke, or as an accusation — anything but the plain truth.",
    intended: "Quiet but unhidden. The voice equivalent of open hands.",
    targetHint: "Drop your pace by a third. Say it once.",
    payoff: "The listener can actually repair it.",
  },
  {
    id: "reminder",
    text: "Hey — this is the second time the report's been late.",
    usually: "Comes out with an edge (“AGAIN?!”) or buried under three cushions so it lands as nothing.",
    intended: "Factual, firm, no contempt. The sentence does the work.",
    targetHint: "Flat delivery is fine here — just don't spike the word “second.”",
    payoff: "The listener hears the pattern, not an attack.",
  },
  {
    id: "ask",
    text: "Can you get this to me by Thursday?",
    usually: "Comes out as “no rush if it's tricky!!” — the ask dissolves before it lands.",
    intended: "Clear and expectant. A deadline said like a deadline.",
    targetHint: "Let “Thursday” drop at the end. Don't lift it into a question.",
    payoff: "The listener treats it as a real date.",
  },
  {
    id: "praise",
    text: "You handled that really well.",
    usually: "Comes out rushed and downward, almost swallowed — praise mumbled is praise withheld.",
    intended: "Unhurried and direct, eye contact in audio form.",
    targetHint: "Fuller volume on “really well.” Let it sit one beat.",
    payoff: "The listener believes you.",
  },
  {
    id: "boundary",
    text: "I'd rather not talk about work tonight.",
    usually: "Comes out with a ready-made court case of justifications nobody asked for.",
    intended: "Light and closed. A preference, not a petition.",
    targetHint: "Smile on the first word — it carries warmth without softening the line.",
    payoff: "The listener moves on instead of negotiating.",
  },
];

/** Pick today's translation line (stable per local day). */
export function getDailyTranslation(day: number): TranslationLine {
  return TRANSLATION_LINES[day % TRANSLATION_LINES.length];
}

/** Which of the two passes comes first — alternates so order never confounds. */
export function passOrder(day: number): ("reflex" | "intended")[] {
  return day % 2 === 0 ? ["reflex", "intended"] : ["intended", "reflex"];
}
