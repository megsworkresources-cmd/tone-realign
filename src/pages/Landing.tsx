import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { WATCH_LIST, videoThumb } from "@/lib/watch-list";
import { READING_LIST } from "@/lib/reading-list";
import {
  ARCHETYPES,
  TONE_CHECK,
  scoreToneCheck,
  type ToneArchetype,
} from "@/lib/tone-check";
import { getDrill } from "@/lib/drills";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  BookOpen,
  Brain,
  Mic,
  Play,
  RefreshCcw,
  ShieldCheck,
  Timer,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const MARQUEE_ITEMS = [
  "CALM IS A SKILL",
  "SPEAK ON THE EXHALE",
  "PAUSE IS POWER",
  "TONE BEFORE WORDS",
  "PRACTICE THE PAUSE",
  "REPLY, DON'T REACT",
];

const STEPS = [
  {
    icon: Mic,
    title: "01 · Speak",
    body: "Pick a drill and talk like you would to a real person. We hand you the prompt; you bring the honesty.",
    color: "bg-sun",
  },
  {
    icon: Activity,
    title: "02 · See",
    body: "While you talk, we listen for pitch, pace, and pressure — then show you the numbers and what they mean.",
    color: "bg-mint",
  },
  {
    icon: Brain,
    title: "03 · Rewire",
    body: "You get a straight read on how you sounded and one thing to try next time. Small reps change the default.",
    color: "bg-coral",
  },
];

const DRILLS_PREVIEW = [
  {
    name: "Steady Ground",
    tag: "Calm under pressure",
    color: "bg-sun",
    body: "Walk through an annoying morning without turning it into a complaint. Then ask for one fix.",
  },
  {
    name: "Warm Open",
    tag: "Warmth & presence",
    color: "bg-mint",
    body: "Greet someone you actually miss and tell them one true thing you appreciate.",
  },
  {
    name: "Firm & Clear",
    tag: "Boundaries",
    color: "bg-coral",
    body: "Say no without trailing off — and let the silence afterward sit there.",
  },
];

/** Rotating hero ticker: the everyday moments where tone decides everything. */
const MOMENTS = [
  "when your boss says “got a minute?”",
  "the “we need to talk” text",
  "when they ask if you're okay",
  "the third time you explain yourself",
  "when “no” gets stuck in your throat",
  "the apology you keep rehearsing",
];

/** Cycling beats for the hero's live-read card. */
const READS: {
  tone: string;
  toneColor: string;
  pace: string;
  pitch: string;
  note: string;
}[] = [
  {
    tone: "Grounded",
    toneColor: "bg-mint",
    pace: "128 wpm",
    pitch: "Steady",
    note: "That's the voice people lean in to. Bottle this one.",
  },
  {
    tone: "Rushed",
    toneColor: "bg-coral",
    pace: "186 wpm",
    pitch: "Climbing",
    note: "You're finishing sentences like they're chasing you. Slow the exhale.",
  },
  {
    tone: "Tense",
    toneColor: "bg-sun",
    pace: "141 wpm",
    pitch: "High",
    note: "Jaw tight, pitch up. Drop your shoulders and say it again — slower.",
  },
  {
    tone: "Flat",
    toneColor: "bg-paper",
    pace: "112 wpm",
    pitch: "Low",
    note: "The words are fine — the energy isn't landing. Lift the ends of your sentences.",
  },
  {
    tone: "Warm",
    toneColor: "bg-mint",
    pace: "135 wpm",
    pitch: "Steady",
    note: "Warmth with a spine. Remember how this felt — that's the rep.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  // Reading-progress bar: a thin coral thread filling as you scroll
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
  });

  // Drives the hero's rotating moments and the live-read card beats
  const [beat, setBeat] = useState(0);
  const [sec, setSec] = useState(7);
  useEffect(() => {
    const beatTimer = setInterval(() => setBeat((b) => b + 1), 2600);
    const secTimer = setInterval(
      () => setSec((s) => (s >= 45 ? 0 : s + 1)),
      1000,
    );
    return () => {
      clearInterval(beatTimer);
      clearInterval(secTimer);
    };
  }, []);
  const momentIdx = beat % MOMENTS.length;
  const read = READS[beat % READS.length];

  // Tone check: three quick answers → the visitor's archetype + their drill
  const [tq, setTq] = useState(0);
  const [answers, setAnswers] = useState<ToneArchetype[]>([]);
  const toneDone = answers.length === TONE_CHECK.length;
  const archetype = toneDone ? ARCHETYPES[scoreToneCheck(answers)] : null;
  const answerTone = (a: ToneArchetype) => {
    setAnswers((prev) => [...prev, a]);
    setTq((n) => n + 1);
  };
  const restartTone = () => {
    setTq(0);
    setAnswers([]);
  };

  return (
    <div className="nb-dots min-h-screen bg-paper">
      {/* Reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-coral"
      />

      {/* Announcement strip */}
      <div className="border-b-2 border-ink bg-ink py-2 text-paper">
        <p className="text-center text-xs font-bold uppercase tracking-widest">
          Your voice reacts before you do. Here's where you catch it.
        </p>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src={logo}
              alt="ShiftedTone"
              width={40}
              height={40}
              className="nb size-10 bg-ink transition-transform duration-200 group-hover:-rotate-6"
            />
            <span className="font-display text-xl">
              Shifted<span className="text-coral">Tone</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide md:flex">
            <a
              href="#how"
              className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:bg-coral after:transition-all hover:after:w-full"
            >
              How it works
            </a>
            <a
              href="#tone-check"
              className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:bg-sun after:transition-all hover:after:w-full"
            >
              Tone check
            </a>
            <a
              href="#drills"
              className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:bg-sun after:transition-all hover:after:w-full"
            >
              Drills
            </a>
            <a
              href="#watch"
              className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:bg-mint after:transition-all hover:after:w-full"
            >
              Watch
            </a>
            <a
              href="#reframe"
              className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:bg-coral after:transition-all hover:after:w-full"
            >
              Reframe
            </a>
          </nav>
          <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
            <NBButton variant="ink" className="px-4 py-2 text-xs">
              {isAuthenticated ? "Open app" : "Start free"}
            </NBButton>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.15 }}
              className="nb inline-flex items-center gap-2 bg-mint px-3 py-1 text-[11px] font-bold uppercase tracking-widest nb-shadow-sm"
            >
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="size-2 bg-coral nb"
              />
              <AudioWaveform className="size-4" />
              The voice tone gym · live
            </motion.div>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              What you{" "}
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 13, delay: 0.35 }}
                className="nb bg-sun px-2 italic inline-block -rotate-1"
              >
                meant
              </motion.span>
              . What they{" "}
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 13, delay: 0.5 }}
                className="nb bg-mint px-2 italic inline-block rotate-1"
              >
                heard
              </motion.span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Most arguments aren't about the words. They're about the tone
              underneath. ShiftedTone hears yours, shows you what it's giving
              away, and trains the gap out — before the next conversation
              needs it.
            </p>

            {/* Rotating real moments */}
            <div className="mt-5 flex h-6 items-center gap-3 text-xs font-bold uppercase tracking-widest">
              <span className="size-2 shrink-0 bg-coral nb" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={momentIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="text-ink/80"
                >
                  {MOMENTS[momentIdx]}
                </motion.span>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link to="/auth">
                <NBButton variant="sun" className="px-6 py-3 text-base">
                  Try your first read <ArrowRight className="size-4" />
                </NBButton>
              </Link>
              <a href="#how">
                <NBButton variant="paper" className="px-6 py-3 text-base">
                  Show me how it works
                </NBButton>
              </a>
            </motion.div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> Your audio stays with you
              </span>
              <span className="flex items-center gap-2">
                <Timer className="size-4" /> 45 seconds, that's it
              </span>
            </div>
          </motion.div>

          {/* Hero visual: live analyzer card */}
          <motion.div
            initial={{ opacity: 0, y: 36, rotate: 2.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.45 }}
            className="relative"
          >
            {/* Flat sun backing block — depth without gradients */}
            <div
              aria-hidden
              className="nb absolute -right-2.5 -top-2.5 h-full w-full rotate-2 bg-sun"
            />
            <NBPanel className="nb-shadow-lg relative self-center transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between border-b-2 border-ink bg-sun px-4 py-2.5">
                <span className="flex items-center gap-2 font-display text-sm">
                  <Mic className="size-4" /> Live read
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                  <motion.span
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="size-2 bg-coral nb"
                  />
                  Rec · 0:{String(sec).padStart(2, "0")}
                </span>
              </div>
              <div className="p-5">
                <div className="flex h-28 items-end gap-1.5" aria-hidden>
                  {[38, 62, 45, 80, 55, 92, 48, 70, 60, 85, 40, 66, 74, 52, 88, 44, 72, 58].map(
                    (h, i) => (
                      <div
                        key={i}
                        className={i % 3 === 0 ? "flex-1 bg-coral" : "flex-1 bg-ink"}
                        style={{
                          height: `${h}%`,
                          animation: `nb-eq ${0.9 + (i % 5) * 0.13}s ease-in-out ${i * 0.07}s infinite`,
                        }}
                      />
                    ),
                  )}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className={`nb p-2.5 ${read.toneColor}`}>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Tone
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={read.tone}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="font-display text-sm"
                      >
                        {read.tone}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="nb bg-paper p-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Pace
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={read.pace}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="font-display text-sm"
                      >
                        {read.pace}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="nb bg-paper p-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Pitch
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={read.pitch}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="font-display text-sm"
                      >
                        {read.pitch}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                <div className="mt-3 nb bg-secondary p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Coach note
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={read.note}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-1 text-sm"
                    >
                      {read.note}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </NBPanel>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-b-2 border-ink bg-ink py-3 text-paper">
        <div className="nb-marquee flex w-max gap-8 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 font-display text-sm uppercase tracking-widest"
            >
              {item}
              <span
                className={`inline-block size-2 ${
                  i % 2 ? "bg-coral" : "bg-sun"
                }`}
              />
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="nb-grid border-b-2 border-ink bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45 }}
              className="font-display text-3xl sm:text-4xl"
            >
              How it <span className="italic text-coral">actually</span> works
            </motion.h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Self-awareness doesn't change anything on its own. Reps do. Every
              take is one.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="transition-transform duration-300 hover:-translate-y-1"
              >
                <NBPanel className="relative h-full overflow-hidden">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-7 -right-1 font-display text-[7.5rem] leading-none text-ink/5"
                  >
                    0{i + 1}
                  </span>
                  <div
                    className={`flex items-center justify-between border-b-2 border-ink px-5 py-3 ${step.color}`}
                  >
                    <span className="font-display text-sm">{step.title}</span>
                    <step.icon className="size-5" />
                  </div>
                  <p className="p-5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </NBPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Drills preview */}
      <section id="drills" className="nb-dots border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl sm:text-4xl">
              Three drills for the moments that{" "}
              <span className="italic text-coral">get to you</span>
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Calm when you're annoyed, warmth when you mean it, and a no that
              doesn't wobble.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DRILLS_PREVIEW.map((drill, i) => (
              <motion.div
                key={drill.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="transition-transform duration-300 hover:-translate-y-1"
              >
                <NBPanel className="flex h-full flex-col">
                  <div className={`border-b-2 border-ink px-5 py-3 ${drill.color}`}>
                    <div className="font-display text-lg leading-tight">{drill.name}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">
                      {drill.tag}
                    </div>
                  </div>
                  <p className="flex-1 p-5 text-sm leading-relaxed text-muted-foreground">
                    {drill.body}
                  </p>
                  <div className="border-t-2 border-ink p-5 pt-4">
                    <Link to="/auth">
                      <NBButton variant="paper" className="w-full py-2 text-xs">
                        Try this drill <ArrowRight className="size-3.5" />
                      </NBButton>
                    </Link>
                  </div>
                </NBPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tone check — 60-second interactive, ends at your drill */}
      <section id="tone-check" className="nb-grid border-b-2 border-ink bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <NBBadge className="bg-coral text-ink">60-second tone check</NBBadge>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                Everyone has a default.{" "}
                <span className="italic text-coral">What's yours?</span>
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                Under pressure, we all reach for the same moves. Three quick
                questions and you'll see yours — plus the drill built
                specifically for it. No mic, no account, no wrong answers.
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm">
                {[
                  "Four archetypes, zero labels-shaming",
                  "Your result pairs with a real drill",
                  "Takes less time than the coffee you're drinking",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Timer className="size-4 shrink-0 text-coral" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <NBPanel className="nb-shadow-duo overflow-hidden">
              {/* Progress header */}
              <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-5 py-3">
                <span className="font-display text-sm">
                  {toneDone ? "Your default" : `Question ${tq + 1} of ${TONE_CHECK.length}`}
                </span>
                <span className="flex gap-1.5">
                  {TONE_CHECK.map((_, i) => (
                    <span
                      key={i}
                      className={`size-2 ${i < answers.length || toneDone ? "bg-coral" : i === tq ? "bg-sun" : "bg-ink/15"}`}
                    />
                  ))}
                </span>
              </div>

              {!toneDone && (
                <div className="p-6">
                  <p className="font-display text-xl leading-snug">
                    {TONE_CHECK[tq].prompt}
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    {TONE_CHECK[tq].options.map((opt) => (
                      <button
                        key={opt.text}
                        type="button"
                        onClick={() => answerTone(opt.archetype)}
                        className="nb nb-press bg-card p-4 text-left text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 hover:bg-paper"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {archetype && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="p-6"
                >
                  <div className={`nb inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${archetype.color}`}>
                    {archetype.name}
                  </div>
                  <p className="mt-4 text-lg leading-relaxed">{archetype.read}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {archetype.pairing}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/auth">
                      <NBButton variant="coral" className="text-sm">
                        <Mic className="size-4" /> Train it now
                      </NBButton>
                    </Link>
                    <NBButton variant="paper" onClick={restartTone} className="text-sm">
                      <RefreshCcw className="size-4" /> Retake
                    </NBButton>
                  </div>
                </motion.div>
              )}
            </NBPanel>
          </div>
        </div>
      </section>

      {/* Watch & learn — teach, then hand the visitor a drill */}
      <section id="watch" className="nb-stripes border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <NBBadge className="bg-sun text-ink">Watch & learn</NBBadge>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                Ideas from the <span className="italic text-sun">pros</span>.
                Reps from you.
              </h2>
            </div>
            <p className="max-w-md text-sm text-paper/70">
              Every video here ends the same way: with a drill underneath it.
              Watch the idea, then use your own voice to make it stick.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WATCH_LIST.map((video, i) => {
              const drill = getDrill(video.practice);
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col"
                >
                  <motion.a
                    href={`https://youtu.be/${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -4 }}
                    className="group block"
                  >
                    <NBPanel className="overflow-hidden border-paper text-paper">
                      <div className="relative border-b-2 border-ink">
                        <img
                          src={videoThumb(video.id)}
                          alt={video.title}
                          loading="lazy"
                          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/10">
                          <span className="nb flex size-12 items-center justify-center bg-sun text-ink nb-shadow-sm transition-transform duration-300 group-hover:scale-110">
                            <Play className="size-5 fill-ink" />
                          </span>
                        </div>
                        {video.minutes != null && (
                          <span className="nb absolute bottom-2 right-2 bg-ink px-1.5 py-0.5 text-[10px] font-bold text-paper">
                            {video.minutes} min
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className={`mb-2 h-1.5 w-10 ${video.color}`} />
                        <h3 className="font-display text-sm leading-snug">
                          {video.title}
                        </h3>
                        <p className="mt-2 flex-1 text-xs leading-relaxed text-paper/60">
                          {video.meta}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-sun">
                          Watch on YouTube
                          <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </NBPanel>
                  </motion.a>

                  {/* The bridge: this video's idea, trainable in the app */}
                  {drill && (
                    <Link
                      to="/auth"
                      className="group/link mt-3 flex items-center justify-between gap-2 border-2 border-paper/25 bg-paper/5 px-3 py-2.5 text-paper transition-colors hover:border-sun hover:bg-sun hover:text-ink"
                    >
                      <span className="flex items-center gap-2">
                        <Mic className="size-4 shrink-0" />
                        <span className="text-left text-[10px] font-bold uppercase tracking-widest">
                          Train it: {drill.name}
                        </span>
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Go deeper — the reading shelf */}
          <div className="mt-16 border-t-2 border-paper/20 pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h3 className="flex items-center gap-2 font-display text-xl">
                <BookOpen className="size-5 text-sun" /> Go deeper
              </h3>
              <p className="max-w-md text-sm text-paper/60">
                The research shelf — books, talks, and studies from the people
                whose work this app stands on. No sign-up, just the sources.
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {READING_LIST.map((r, i) => (
                <motion.a
                  key={r.title}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="group flex items-start gap-4 border-2 border-paper/25 bg-paper/5 p-4 text-paper transition-colors hover:border-paper/60 hover:bg-paper/10"
                >
                  <span className={`mt-1 h-10 w-1.5 shrink-0 ${r.color}`} />
                  <span className="min-w-0 flex-1">
                    <span className="font-display text-sm leading-snug">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-sun">
                      {r.source}
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-paper/60">
                      {r.blurb}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-paper/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sun" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reframe section */}
      <section id="reframe" className="border-b-2 border-ink">
        <div className="nb-grid-dots">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-20">
            <div>
              <NBBadge className="bg-coral text-ink">Reframe lab</NBBadge>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                Catch it. Reframe it.{" "}
                <span className="italic text-coral">Rehearse it.</span>
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                We all have a reply we regret the second it leaves our mouth.
                Write down what set you off and what you almost said — the lab
                helps you find the version you'd actually be proud of, plus a
                note on how to say it out loud.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "Name what happened — no judgment",
                  "See your gut reaction in writing",
                  "Get a calmer version, in your own words",
                  "Then practice saying it",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <RefreshCcw className="size-4 shrink-0 text-coral" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-8 inline-block">
                <NBButton variant="coral" className="px-6 py-3 text-base">
                  Open the reframe lab <ArrowRight className="size-4" />
                </NBButton>
              </Link>
            </div>

            {/* Reframe card preview */}
            <NBPanel className="nb-shadow-duo self-center transition-transform duration-300 hover:-translate-y-1">
              <div className="border-b-2 border-ink bg-coral px-4 py-2.5 text-ink">
                <span className="font-display text-sm">Reframe #047</span>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Trigger
                </p>
                <p className="nb mt-1.5 bg-secondary p-3 text-sm">
                  Boss emails "we need to talk." No context.
                </p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Automatic reaction
                </p>
                <p className="nb mt-1.5 bg-secondary p-3 text-sm">
                  "Great, what now." Heart pounding, thumbs already typing a
                  defense.
                </p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Reframed response
                </p>
                <p className="nb mt-1.5 -rotate-[0.6deg] bg-mint p-3 text-sm font-medium">
                  "Happy to talk — send over the agenda so I can come prepared."
                </p>
                <div className="nb mt-3 rotate-[0.5deg] bg-sun p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Delivery note
                  </p>
                  <p className="mt-1 text-sm">
                    Even and unhurried. You're asking a question, not asking
                    permission.
                  </p>
                </div>
              </div>
            </NBPanel>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-sun">
        <div
          aria-hidden
          className="nb-rays nb-spin-slow pointer-events-none absolute -inset-[60%]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center lg:py-20">
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">
            The next hard conversation is already on your calendar. What{" "}
            <span className="italic">version of you</span> shows up?
          </h2>
          <p className="max-w-xl text-ink/70">
            It's free to start. The only equipment is the microphone you
            already own.
          </p>
          <Link to="/auth">
            <NBButton variant="ink" className="nb-shadow-lg px-8 py-4 text-lg">
              Start practicing free <ArrowRight className="size-5" />
            </NBButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="ShiftedTone"
              width={32}
              height={32}
              className="nb size-8 bg-ink"
            />
            <span className="font-display text-sm">
              Shifted<span className="text-coral">Tone</span>
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Train the tone. Keep what you mean.
          </p>
        </div>
      </footer>
    </div>
  );
}
