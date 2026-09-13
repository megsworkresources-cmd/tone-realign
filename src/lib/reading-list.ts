/**
 * "Go deeper" — reputable, non-YouTube resources on communication,
 * tone, and regulated responses. Every link points at the author or
 * institution that produced the work (no aggregators).
 */

export interface ReadingResource {
  title: string;
  /** Who made it — shown as the authority line. */
  source: string;
  blurb: string;
  url: string;
  /** Tailwind bg utility for the accent bar. */
  color: string;
  kind: "book" | "article" | "research" | "podcast" | "tool";
}

export const READING_LIST: ReadingResource[] = [
  {
    title: "Supercommunicators",
    source: "Charles Duhigg · book",
    blurb:
      "Every conversation is one of three — practical, emotional, social. Match the wrong one and everything misfires. The matching skill is trainable.",
    url: "https://charlesduhigg.com/supercommunicators/",
    color: "bg-sun",
    kind: "book",
  },
  {
    title: "Cues: Master the Secret Language of Charismatic Communication",
    source: "Vanessa Van Edwards · book",
    blurb:
      "The research lab behind the app's warmth drills. Cues decodes exactly which vocal and facial signals build — or spend — trust.",
    url: "https://www.scienceofpeople.com/cues/",
    color: "bg-mint",
    kind: "book",
  },
  {
    title: "The Ellipsis Manual",
    source: "Chase Hughes · book",
    blurb:
      "The behavior-profiling manual from the Navy trainer who taught interrogation teams to read tone, tempo, and tension in real time.",
    url: "https://www.chasehughesofficial.com/",
    color: "bg-coral",
    kind: "book",
  },
  {
    title: "How to Speak So That People Want to Listen",
    source: "Julian Treasure · TED · 9:44",
    blurb:
      "The seven deadly sins of speaking, and the four foundations — HAIL. Fifty-one million people have watched it for a reason.",
    url: "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen",
    color: "bg-paper",
    kind: "article",
  },
  {
    title: "What Great Listeners Actually Do",
    source: "Harvard Business Review",
    blurb:
      "Good listening isn't silence — it's questions that promote discovery and suggestions that build self-esteem. Backed by Zenger Folkman's data.",
    url: "https://hbr.org/2016/07/what-great-listeners-actually-do",
    color: "bg-sun",
    kind: "article",
  },
  {
    title: "The “R is for Repair” Research",
    source: "The Gottman Institute",
    blurb:
      "Gottman's lab found repair attempts — any move that stops negativity escalating — predict relationship survival. The Skill exists; it can be practiced.",
    url: "https://www.gottman.com/blog/r-is-for-repair/",
    color: "bg-mint",
    kind: "research",
  },
  {
    title: "How Miscommunication Happens (and How to Avoid It)",
    source: "Katherine Hampsten · TED-Ed · 4:44",
    blurb:
      "The animated origin story of every “that's not what I meant” — and why the tone channel carries the blame.",
    url: "https://www.youtube.com/watch?v=gCfzeONu3Mo",
    color: "bg-coral",
    kind: "article",
  },
];
