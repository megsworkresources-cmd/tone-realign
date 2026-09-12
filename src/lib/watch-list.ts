/**
 * Curated external videos on tone, delivery, and regulated responses.
 * Consumed by the "Watch & learn" section of the landing page.
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
}

export const WATCH_LIST: WatchVideo[] = [
  {
    id: "ZcvbDuTeEhQ",
    title: "How To Get Any Conversation UNSTUCK",
    meta: "Recognize lost traction, name it without blame, and get dialogue moving again.",
    color: "bg-sun",
    minutes: 12,
  },
  {
    id: "bNIPVejCzyY",
    title: "How to Say What Needs to Be Said (Without Being Mean)",
    meta: "Know your motive, soften the delivery, and land the message without collateral damage.",
    color: "bg-mint",
    minutes: 9,
  },
  {
    id: "3tR-2fnzUEo",
    title: "3 Phrases to Stay in Control of the Conversation",
    meta: "Three short phrases that keep you composed and steering when things get heated.",
    color: "bg-coral",
    minutes: 1,
  },
  {
    id: "Jp2SBS1LTuk",
    title: "Speak Warmly, Present Confidently: The Ultimate Voice Hack!",
    meta: "The voice trifecta: broad body, purposeful pauses, and speaking on the out-breath.",
    color: "bg-paper",
  },
  {
    id: "FD3H1dpPGtk",
    title: "YOUR TONE MATTERS!",
    meta: "A sixty-second reminder that how you sound decides how you're heard.",
    color: "bg-sun",
  },
];

export function videoThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
