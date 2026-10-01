import { NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import { Lock, Mail, Mic, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { Link } from "react-router";

/**
 * Where users ask "what happens to my voice?" — and the single place the
 * app owner keeps the answers honest. Update SUPPORT_EMAIL to your real
 * address before launch; every deletion request routes there.
 */
const SUPPORT_EMAIL = "support@example.com";

const SECTIONS = [
  {
    icon: Mic,
    title: "What gets recorded",
    body: [
      "When you tap a record button, your microphone turns on and the sound is analyzed right in your browser — volume, pitch, pace. Recordings you don't save disappear the moment you close or reload the page.",
    ],
  },
  {
    icon: Lock,
    title: "What gets saved — only when you say so",
    body: [
      "On the Take page, nothing is stored until you tap \"Add to my log.\" Saving keeps that take so you can review it later: the audio (up to 10 MB), your scores, the drill and date, and a text transcript if your browser provides one.",
      "The Translate exercise is listen-only: recordings stay on your device and are never uploaded.",
    ],
  },
  {
    icon: UserCheck,
    title: "Who else touches your data",
    body: [
      "The app runs on standard hosting platforms (Vercel and Convex) — that's where your account and saved takes live.",
      "If your browser offers speech-to-text, the audio goes to that browser maker's service (for example, Google in Chrome) to produce the transcript. It works with or without the transcript.",
      "When you ask the coach for feedback on a saved take, your scores and transcript for that take are sent to an AI service to write the note. It is never used to train public AI models.",
      "Anonymous page-visit counts are collected to keep the site healthy. No ads, no trackers that follow you around the internet.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "What we never do",
    body: [
      "We never sell your data. We never run ads. We never publish or share your recordings. Your voice is yours.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Ground rules for recording",
    body: [
      "Record only yourself. If other people are in the room, the microphone will hear them too — find a private spot, or use headphones with a mic.",
      "Don't record confidential calls or conversations you're only part of. This tool is for practicing your own delivery.",
    ],
  },
  {
    icon: Trash2,
    title: "Deleting your data",
    body: [
      `Want a take or your whole account removed? Email ${SUPPORT_EMAIL} and it's deleted — audio, transcripts, scores, everything.`,
    ],
  },
];

/**
 * /privacy — the plain-words record of what the app does with microphone
 * audio and account data. Linked from the recorders, the sign-in form,
 * the menus, and the footer.
 */
export default function Privacy() {
  return (
    <PublicLayout>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Privacy
          </p>
          <h1 className="mt-1 font-display text-3xl text-balance sm:text-4xl">
            Your voice, in <span className="italic text-sun">plain words</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            What ShiftedTone records, what it keeps, and what it never does.
          </p>
        </section>

        <NBPanel className="bg-sun nb-shadow">
          <div className="flex flex-col gap-2 p-5 text-sm">
            <p className="font-bold uppercase tracking-widest text-[10px]">
              The short version
            </p>
            <p>
              Your recordings stay on your device until you choose to save
              one. Saved takes keep the audio, your scores, and an optional
              transcript — so you can hear yourself improve.
            </p>
            <p>
              We never sell your data, never show ads, and never publish your
              recordings.
            </p>
          </div>
        </NBPanel>

        {SECTIONS.map((s) => (
          <NBPanel key={s.title} className="p-5">
            <div className="flex items-center gap-2">
              <span className="nb flex size-8 shrink-0 items-center justify-center bg-sun">
                <s.icon className="size-4" />
              </span>
              <h2 className="font-display text-lg">{s.title}</h2>
            </div>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </NBPanel>
        ))}

        <NBPanel className="p-5">
          <h2 className="font-display text-lg">Children</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            ShiftedTone isn't for children under 13, and we don't knowingly
            collect their data.
          </p>
        </NBPanel>

        <NBPanel className="bg-mint p-5">
          <h2 className="font-display text-lg">Questions or deletions</h2>
          <p className="mt-2 text-sm">
            One email gets a real answer — or your data deleted.
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 inline-block">
            <NBButton variant="ink" className="text-xs">
              <Mail className="size-3.5" /> {SUPPORT_EMAIL}
            </NBButton>
          </a>
        </NBPanel>

        <p className="text-xs text-muted-foreground">
          Changes to this policy are posted on this page. Last updated:
          October 2026.
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Ready to practice?{" "}
          <Link to="/drills" className="font-bold text-coral hover:underline">
            Pick a drill
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}
