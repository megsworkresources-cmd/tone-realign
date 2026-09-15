/**
 * "Catch the Leak" — ear training for the other side of tone: hearing what
 * a line's delivery broadcasts before you answer it. Each scenario shows a
 * text-message-like line plus how it was delivered; the user names the
 * leak — the thing the words don't say but the voice does.
 */

export interface LeakOption {
  text: string;
  /** Shown after answering: why this is (or isn't) the leak. */
  note: string;
}

export interface LeakScenario {
  id: string;
  /** Who sent it, for flavor. */
  from: string;
  /** The literal words. */
  words: string;
  /** How it was delivered — the acoustic context the user "hears". */
  delivered: string;
  options: LeakOption[];
  /** Index of the option that names the actual leak. */
  answer: number;
}

export const LEAKS: LeakScenario[] = [
  {
    id: "fine",
    from: "Your partner",
    words: "“Fine. Whatever works for you.”",
    delivered: "Fast, pitch rises at the end, volume drops away on “you.”",
    options: [
      { text: "They're genuinely easygoing about it", note: "Genuinely easygoing sounds unhurried and even. The speed here is the tell — speed is what urgency looks like." },
      { text: "It is not fine, and you just got assigned the blame", note: "Right. The pitch rise + volume fade is the “fine, whatever” signature: surrender with an invoice attached. You'll pay it later." },
      { text: "They didn't read the message properly", note: "The delivery is doing something deliberate — rushed fade-outs don't happen by accident." },
    ],
    answer: 1,
  },
  {
    id: "sure-thing",
    from: "A coworker you asked for help",
    words: "“Yeah, sure, I can take a look at it.”",
    delivered: "Long pause before “yeah,” flat pitch throughout, sigh at the end.",
    options: [
      { text: "They're happy to, just busy", note: "A happy-to would still have pitch in it. This delivery is flat the way someone is flat when they've stopped arguing with you in their head." },
      { text: "The pause and the sigh are the real answer: this is a no", note: "Right. Words said yes; everything else said no. When they conflict, believe the delivery — and make it easy for them to say the real one." },
      { text: "Their microphone cut in and out", note: "The pattern is too consistent for a technical artifact. The pause-before-yes is a classic pre-no hesitation." },
    ],
    answer: 1,
  },
  {
    id: "nice-of-you",
    from: "Your brother, about a favor you asked",
    words: "“Wow. Nice of you to finally call.”",
    delivered: "Light and quick, but there's a hard little stop after “Wow.”",
    options: [
      { text: "He's teasing you, all in good fun", note: "Teasing has bounce through the whole line. The hard stop after “Wow” is a drop of real grievance the joke is riding on." },
      { text: "He's actually hurt, and the joke is how it gets said", note: "Right. The jab wrapped in a laugh is how a lot of men deliver hurt. Answer the hurt, not the joke — or laugh and lose the message." },
      { text: "He's rehearsing a complaint for later", note: "There's real feeling here, but it's present-tense hurt, not stored ammunition." },
    ],
    answer: 1,
  },
  {
    id: "no-rush",
    from: "Your client",
    words: "“No rush at all whenever you get to it!”",
    delivered: "The words end cheerful but the pace slows down on “whenever you get to it.”",
    options: [
      { text: "It truly isn't urgent", note: "When it truly isn't urgent, pace stays level all the way through. The slowdown is the real sentence breaking through the exclamation points." },
      { text: "It is urgent, and the cheerfulness is costing them something", note: "Right. The deceleration under the “!” is the polite leash people put on real urgency. Ask for the actual date." },
      { text: "They forgot they sent it", note: "The measured slowdown is deliberate — forgetters don't pace their endings." },
    ],
    answer: 1,
  },
  {
    id: "take-care",
    from: "HR, ending a call",
    words: "“Okay. Well — take care.”",
    delivered: "Volume drops through the sentence; the last word almost disappears.",
    options: [
      { text: "Warm sign-off, nothing there", note: "Warm sign-offs keep their volume — fading is how sentences end when someone is ending more than a sentence." },
      { text: "That was a decision being delivered, softly", note: "Right. The fade on the final word is the sound of a door being closed without a slam. Follow up in writing." },
      { text: "They had somewhere to be", note: "Busy people still end calls at full volume. The fade is choice, not schedule." },
    ],
    answer: 1,
  },
  {
    id: "sounds-good",
    from: "Your manager, on your proposal",
    words: "“Mm. Sounds good.”",
    delivered: "Two seconds of silence before it; the “good” is flat and low.",
    options: [
      { text: "Approval — move on", note: "Real approval comes with energy or detail. Flat low “good” after silence is a verdict you should be nervous about." },
      { text: "Approval withheld — they're not sold, and saying so would be work", note: "Right. The two-second silence is them deciding whether the fight is worth it. Ask one specific question and give them the cheaper way to be honest." },
      { text: "They're multitasking", note: "Multitaskers sound rushed, not flat. Flat is a decision, not a distraction." },
    ],
    answer: 1,
  },
];

/** Pick today's leak scenario (stable per local day). */
export function getDailyLeak(day: number): LeakScenario {
  return LEAKS[day % LEAKS.length];
}
