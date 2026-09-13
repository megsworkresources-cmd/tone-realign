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
    meta: "When a conversation stalls, say so — out loud, without blame. Fisher shows you how.",
    color: "bg-sun",
    minutes: 12,
  },
  {
    id: "bNIPVejCzyY",
    title: "How to Say What Needs to Be Said (Without Being Mean)",
    meta: "Figure out why you're saying it first. Then say it so it lands without leaving a mark.",
    color: "bg-mint",
    minutes: 9,
  },
  {
    id: "3tR-2fnzUEo",
    title: "3 Phrases to Stay in Control of the Conversation",
    meta: "Three sentences worth memorizing for the next time things get heated.",
    color: "bg-coral",
    minutes: 1,
  },
  {
    id: "Jp2SBS1LTuk",
    title: "Speak Warmly, Present Confidently: The Ultimate Voice Hack!",
    meta: "Broad body, real pauses, speak on the exhale. Her trifecta works — we test it every day.",
    color: "bg-paper",
  },
  {
    id: "FD3H1dpPGtk",
    title: "YOUR TONE MATTERS!",
    meta: "Sixty seconds on why people hear your tone long before your words.",
    color: "bg-sun",
  },
];

export function videoThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
