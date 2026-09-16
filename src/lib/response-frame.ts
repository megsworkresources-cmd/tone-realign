/**
 * The Response Frame — how to think before you speak.
 *
 * Four questions that turn a reaction into a response. Pure data, no
 * React: the questions, why each matters, and the self-check that
 * confirms you've actually answered it. Consumed by the ResponsePlanner
 * component (Translate between passes, Reframe before writing).
 */

export interface FrameStep {
  id: string;
  /** The question, as you'd ask yourself in the moment. */
  question: string;
  /** Why this question changes what comes out of your mouth. */
  why: string;
  /** How to actually work the answer out. */
  how: string;
  /** A fast gut-check that the answer is honest, not rehearsed. */
  check: string;
  /** Accent color (tailwind bg utility). */
  color: string;
}

export const FRAME_STEPS: FrameStep[] = [
  {
    id: "their-move",
    question: "What do they want me to feel or do?",
    why: "Most reactions aren't yours — they're the move working. A jab wants you hot; a guilt trip wants you apologizing; silence wants you filling it. Naming the intended effect puts the choice back with you.",
    how: "Finish this sentence honestly: \"If I react the obvious way, the winner is ___.\" If the answer is their play — the provocation, the deadline, the sigh engineered to redirect blame — you've found the trapdoor.",
    check: "If your answer is \"nothing, they're just like that,\" look again at what you feel the urge to do. The urge is the tell.",
    color: "bg-coral",
  },
  {
    id: "underneath",
    question: "What's the message underneath the message?",
    why: "Words ride on a subtext: the complaint about the dishes is often \"I feel unsupported\"; the \"fine, whatever\" is often \"I don't believe this changes anything.\" Answering the subtext instead of the words is what makes people feel heard.",
    how: "Ask what fear or need is doing the talking: fear of being invisible, unheard, controlled, unappreciated? Then try one level down: \"If I take the words at face value and fix exactly that, will this come back?\" If yes, you haven't reached the layer that matters.",
    check: "Could you state their underlying message in one sentence, without arguing whether it's fair? If you can't yet, you're still negotiating with the surface.",
    color: "bg-sun",
  },
  {
    id: "aftertaste",
    question: "How do I want them to feel after hearing it?",
    why: "This is the finish line, and it's chosen before the first word. \"Cornered\" gets you compliance that resentment revokes later. \"Heard and clear\" gets you a partner in the fix. You can't control their reaction — but you pick what you're aiming at.",
    how: "Pick two words, not a speech: steady. respected. unthreatened. taken seriously. Then test your draft against them — if the words are right but the feeling is wrong, the problem is pace, volume, or pitch, not content.",
    check: "Say the goal out loud. If it's \"make them see they're wrong,\" that's a verdict, not a feeling — pick what you want them to feel once they've seen it.",
    color: "bg-mint",
  },
  {
    id: "ask",
    question: "What kind of message is this — and what's the ask?",
    why: "A message that wants agreement, acknowledgment, or just to be heard needs different shape. Information wants clarity. A boundary wants calm repetition, not a debate. If you don't know the kind, you'll use the wrong tone for a message that was fine.",
    how: "Pick one: Are we agreeing on something (end with a clear proposal)? Am I acknowledging them (end by reflecting what they said)? Am I setting a limit (end with what you will do, repeated as needed)? Am I repairing (own your part first, then the fix)?",
    check: "Could the other person say back to you what you're asking for? If not, the ask is still fog — sharpen it before you speak.",
    color: "bg-paper",
  },
];

/**
 * Message archetypes for step four: one-line "you'll know it's this
 * when" cues and what a good version sounds like.
 */
export interface MessageKind {
  id: string;
  label: string;
  /** How you recognize this kind of message. */
  cue: string;
  /** The shape of a response that works. */
  shape: string;
  /** What the ending sounds like. */
  ending: string;
  color: string;
}

export const MESSAGE_KINDS: MessageKind[] = [
  {
    id: "agree",
    label: "Come to an agreement",
    cue: "There's a decision to make and you both have a stake in it — schedules, money, plans, who does what.",
    shape: "Name the shared goal first, then your position, then invite theirs. Keep it one issue; scope is what keeps disagreement survivable.",
    ending: "\"Does that work for you, or what would you change?\"",
    color: "bg-mint",
  },
  {
    id: "acknowledge",
    label: "Acknowledge / validate",
    cue: "They're hurting, frustrated, or proud — and the moment calls for them to feel it landed before anything gets fixed.",
    shape: "Reflect the feeling and the reason it makes sense. Resist the fix; an early solution reads as \"stop feeling this.\"",
    ending: "\"That makes sense. I'm glad you told me.\"",
    color: "bg-sun",
  },
  {
    id: "boundary",
    label: "Set a boundary",
    cue: "You're not asking them to change — you're saying what you'll do. Late-night texts, tone, recurring favors.",
    shape: "Warm, brief, and unapologetic. One sentence of care, one of the limit, one of what you'll do. No jury needed.",
    ending: "\"I'm not discussing this again tonight — I'll pick this up tomorrow.\"",
    color: "bg-coral",
  },
  {
    id: "repair",
    label: "Repair after a miss",
    cue: "You snapped, missed, or dropped something and the relationship now has a splinter in it.",
    shape: "Own the specific impact (not \"if I upset you\"), say what you'll do differently, and let them respond without managing their reaction.",
    ending: "\"That came out sharper than I meant. Here's what I'll do differently.\"",
    color: "bg-paper",
  },
  {
    id: "inform",
    label: "Deliver information",
    cue: "News, a decision already made, a status. The goal is accuracy and composure — not buy-in you haven't got.",
    shape: "Lead with the point, then the reason, then what changes for them. Steady volume; don't soften the news with your tone and force them to excavate it.",
    ending: "\"I wanted you to hear it from me first. What questions do you have?\"",
    color: "bg-secondary",
  },
  {
    id: "de-escalate",
    label: "Bring the temperature down",
    cue: "Voices are up, pace is fast, and the room is one sentence from saying something that can't be unsaid.",
    shape: "Drop your volume and speed below theirs — the gap resets the room. Name the process, not the content: slow, low, one voice at a time.",
    ending: "\"I want to hear this — and I can only hear it one voice at a time.\"",
    color: "bg-sun",
  },
];

/** Suggested goal-line copy for Reframe's "your goal" field, per kind. */
export const KIND_GOAL_HINTS: Record<string, string> = {
  agree: "get to a clear yes we both accept",
  acknowledge: "make them feel heard before anything else",
  boundary: "state the limit once, calmly, and hold it",
  repair: "own my part cleanly and name the fix",
  inform: "deliver the news steady and unsoftened",
  "de-escalate": "lower the temperature without matching theirs",
};
