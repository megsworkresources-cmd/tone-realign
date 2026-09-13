/**
 * "Read the Room" — scenario quizzes that train the judgment behind tone:
 * what a situation calls for, and what your options actually sound like.
 * Mic-free, mobile-friendly, and quick enough to do over coffee.
 */

export interface QuizOption {
  text: string;
  /** What this choice broadcasts, explained warmly. */
  note: string;
}

export interface QuizQuestion {
  id: string;
  /** The situation, written like a text from someone you know. */
  scene: string;
  /** Who's talking, for flavor. */
  from: string;
  options: QuizOption[];
  /** Index of the option that best balances honesty and warmth. */
  best: number;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "boss-minute",
    from: "Your boss, 4:58pm",
    scene: "“Got a minute? Need to ask you something before you head out.”",
    options: [
      {
        text: "“Sure — one minute!” (chipper, fast)",
        note: "Cheerful and quick, but the speed leaks anxiety. And you may not actually have a minute.",
      },
      {
        text: "“Give me ten and I'm fully yours.” (calm, unhurried)",
        note: "Best of both: warm, honest about time, and it buys you a breath. Nobody resents a specific ten.",
      },
      {
        text: "“Can this wait till tomorrow?” (flat)",
        note: "Defensible — but the flatness reads as “don't want to,” even when that's not true.",
      },
    ],
    best: 1,
  },
  {
    id: "snippy-text",
    from: "Your sister",
    scene: "“Fine. Do whatever you want.”",
    options: [
      {
        text: "“I'm not doing anything you want!” (matching energy)",
        note: "Escalation guaranteed. Her words came out flat; yours would come out pointed. Different weapons.",
      },
      {
        text: "(no reply)",
        note: "Silence is a tone too. It reads as agreement or stonewalling — rarely what you mean.",
      },
      {
        text: "“That didn't land how I meant it. Call me tonight?” (level, warm)",
        note: "The move: name the miss without re-litigating, and offer the channel where tone can actually be heard.",
      },
    ],
    best: 2,
  },
  {
    id: "credit-steal",
    from: "A coworker, in the meeting",
    scene: "“Yeah, I put together the proposal last week, and I think it's strong.”",
    options: [
      {
        text: "“Actually, I wrote most of it.” (corrective, loud)",
        note: "You're right on facts — and the volume turns the room's sympathy into discomfort. Correction can be quiet.",
      },
      {
        text: "“So glad it landed! Building on that — the data I pulled shows…” (warm, firm)",
        note: "The claim lands without a fight: your work is now visible and attached to you, and you look generous doing it.",
      },
      {
        text: "(say nothing, seethe)",
        note: "The seethe is real, and so is the resentment you'll carry into tomorrow's meeting. Cheap now, expensive later.",
      },
    ],
    best: 1,
  },
  {
    id: "running-late",
    from: "A friend, waiting at the restaurant",
    scene: "“Where are you?? I've been sitting here 20 minutes.”",
    options: [
      {
        text: "“OMG so sorry!!! Be there in 5!!!” (breathless)",
        note: "The exclamation points are doing apology labor your voice would do better. It also invites “it's fine!!” theater.",
      },
      {
        text: "“Traffic's bad. Order without me.” (clipped)",
        note: "True but cold. The brevity reads as annoyance at them, when the annoyance is at you.",
      },
      {
        text: "“I'm sorry — 20 minutes was my fault. 6 more, order the garlic bread.” (owning it, warm)",
        note: "Clean apology, real ETA, and the garlic bread turns a flake into a plan. Warmth costs one extra clause.",
      },
    ],
    best: 2,
  },
  {
    id: "boundary-push",
    from: "Your neighbor, at the door",
    scene: "“You don't mind watching Ringo this weekend again, right? You're so good with him.”",
    options: [
      {
        text: "“I mean… I guess, again.” (resigned)",
        note: "The sigh does the heavy lifting — and resentment is now scheduled for Saturday. Compliance isn't kindness.",
      },
      {
        text: "“No can do this weekend.” (cheerful, no reasons)",
        note: "Strong move: the cheerfulness signals there's no wound to soothe, and no reasons means nothing to argue with.",
      },
      {
        text: "“We're SO busy, sorry sorry — maybe next month?” (apologetic spiral)",
        note: "The spiral teaches them the pressure works. Next month is also not a yes.",
      },
    ],
    best: 1,
  },
  {
    id: "unwanted-advice",
    from: "Your uncle, at dinner",
    scene: "“You know, in my day people your age had houses by 30. Just saying.”",
    options: [
      {
        text: "“It's complicated, you wouldn't get it.” (sharp)",
        note: "Satisfying for two seconds. Then someone's explaining your tone to the whole table.",
      },
      {
        text: "“Ha — and in my day people your age didn't give financial advice at dinner.” (playful jab)",
        note: "Witty, and it escalates: now it's a duel. You'd better want the whole fight, because this opens it.",
      },
      {
        text: "“Houses were 3x salary then and 8x now — crazy, right?” (easy, factual)",
        note: "The data does the pushing back so your tone never has to. Almost impossible to start a fight with.",
      },
    ],
    best: 2,
  },
];

/** One question per day, cycling — the quiz is a daily ritual, not a batch. */
export function getDailyQuestion(day: number): QuizQuestion {
  return QUIZ[day % QUIZ.length];
}
