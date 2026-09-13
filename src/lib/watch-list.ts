/**
 * Curated external videos on tone, delivery, and regulated responses.
 * Consumed by the "Watch & learn" section of the landing page.
 *
 * `practice` is the landing→app bridge: after (or before) watching, the
 * visitor is handed the drill that lets them *use* the idea with their
 * own voice — the section teaches, the app trains.
 */

export interface WatchVideo {
  /** YouTube video id. */
  id: string;
  title: string;
  meta: string;
  /** Tailwind background utility for the card's color bar. */
  color: string;
  /** Duration in minutes. Omit for Shorts / unverified runtimes. */
  minutes?: number;
  /** Drill id from lib/drills that puts this idea into practice. */
  practice: string;
}

export const WATCH_LIST: WatchVideo[] = [
  {
    id: "ZcvbDuTeEhQ",
    title: "How To Get Any Conversation UNSTUCK",
    meta: "When a conversation stalls, say so — out loud, without blame. Fisher shows you how.",
    color: "bg-sun",
    minutes: 12,
    practice: "steady-ground",
  },
  {
    id: "bNIPVejCzyY",
    title: "How to Say What Needs to Be Said (Without Being Mean)",
    meta: "Figure out why you're saying it first. Then say it so it lands without leaving a mark.",
    color: "bg-mint",
    minutes: 9,
    practice: "firm-clear",
  },
  {
    id: "3tR-2fnzUEo",
    title: "3 Phrases to Stay in Control of the Conversation",
    meta: "Three sentences worth memorizing for the next time things get heated.",
    color: "bg-coral",
    minutes: 1,
    practice: "unruffled",
  },
  {
    id: "Jp2SBS1LTuk",
    title: "Speak Warmly, Present Confidently: The Ultimate Voice Hack!",
    meta: "Broad body, real pauses, speak on the exhale. Her trifecta works — we test it every day.",
    color: "bg-paper",
    practice: "warm-open",
  },
  {
    id: "FD3H1dpPGtk",
    title: "YOUR TONE MATTERS!",
    meta: "Sixty seconds on why people hear your tone long before your words.",
    color: "bg-sun",
    practice: "steady-ground",
  },
  {
    id: "RvjR9GM2kX8",
    title: "Instantly Read Any Room (and Hack Your Discipline)",
    meta: "A Navy interrogator's guide to what your posture, pace, and pauses broadcast before you say a word.",
    color: "bg-mint",
    practice: "unruffled",
  },
  {
    id: "uRQAhWZ1bxs",
    title: "The Blueprint for Mastering Every Conversation",
    meta: "Jay Shetty and Jefferson Fisher on why the first move isn't talking — it's deciding which conversation you're in.",
    color: "bg-coral",
    practice: "steady-ground",
  },
];

export function videoThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
