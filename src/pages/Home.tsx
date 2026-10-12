import { NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import { useAuth } from "@/hooks/use-auth";
import { DRILLS } from "@/lib/drills";
import {
  ArrowRight,
  AudioWaveform,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";

/** Rotating hero ticker: the everyday moments where tone decides everything. */
const MOMENTS = [
  "when your boss says “got a minute?”",
  "the “we need to talk” text",
  "when they ask if you're okay",
  "the third time you explain yourself",
  "when “no” gets stuck in your throat",
  "the apology you keep rehearsing",
];

/** Cycling example beats for the hero's preview card — demo data, not the user's mic. */
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

const MARQUEE_ITEMS = [
  "CALM IS A SKILL",
  "SPEAK ON THE EXHALE",
  "PAUSE IS POWER",
  "TONE BEFORE WORDS",
  "PRACTICE THE PAUSE",
  "REPLY, DON'T REACT",
];

const VALUE_PROPS = [
  {
    title: "Real-time feedback",
    body: "Get instant readings on calm, clarity, energy, and stability before the next important conversation.",
  },
  {
    title: "Practice the real moment",
    body: "Use guided drills modeled on high-stakes situations instead of vague confidence advice.",
  },
  {
    title: "Coach notes that make sense",
    body: "See the exact factor to improve next time — not a generic performance score.",
  },
  {
    title: "Build a stronger voice",
    body: "Track your progress over time and notice the changes that actually change how people hear you.",
  },
  {
    title: "Leave your audio alone",
    body: "Your tone data can help you improve without forcing you to save every recording.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick a drill",
    body: "Choose a real-world situation like calm follow-up, clear boundary, warm recovery, or strong reset.",
  },
  {
    step: "02",
    title: "Record your response",
    body: "Speak naturally for 30–60 seconds and get immediate readings on tone, pace, and clarity.",
  },
  {
    step: "03",
    title: "Practice the lever",
    body: "See the biggest factor to improve, get coach notes, and repeat the drill until it feels natural.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I caught myself rushing in the first two minutes of the call. The drill showed exactly where my tone was slipping — and it helped immediately.",
    name: "Maya R.",
    title: "Sales manager",
  },
  {
    quote:
      "This is the first communication tool that feels practical. It isn't abstract advice — it's a voice practice system.",
    name: "Julian P.",
    title: "Founder",
  },
  {
    quote:
      "I used it before a difficult client conversation and it put me on a calmer track in under ten minutes.",
    name: "Nina T.",
    title: "Client success lead",
  },
];

const FAQ_ITEMS = [
  {
    q: "Does it save my audio?",
    a: "No — your audio is only kept if you choose to save it. The analysis and scores can still help you improve without storing every take.",
  },
  {
    q: "Who is this for?",
    a: "It works best for founders, sales professionals, consultants, recruiters, team leads, and anyone whose tone affects trust, influence, and outcomes.",
  },
  {
    q: "Is this therapy or coaching?",
    a: "No. This is a communication training and practice app. It helps you build observable habits in how you sound and respond under pressure.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The product is browser-based and designed for quick practice sessions on desktop or mobile devices.",
  },
  {
    q: "Can teams use it?",
    a: "Yes. The Team pilot plan is designed for client-facing teams that want consistent communication practice and progress tracking.",
  },
];

const TRUST_BADGES = [
  "Privacy-first",
  "Works in-browser",
  "No hidden setup",
  "Built for high-stakes conversations",
  "Fast practice loops",
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  // Drives the hero's rotating moments and the example-read card beats
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const beatTimer = setInterval(() => setBeat((b) => b + 1), 2600);
    return () => clearInterval(beatTimer);
  }, []);
  const momentIdx = beat % MOMENTS.length;
  const read = READS[beat % READS.length];

  return (
    <PublicLayout>
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
              underneath. ShiftedTone helps you hear how your voice comes
              across, understand the patterns underneath it, and practice a
              different response before the next conversation needs it.
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
              <Link to="/how">
                <NBButton variant="paper" className="px-6 py-3 text-base">
                  Show me how it works
                </NBButton>
              </Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> We keep the scores, not your audio
              </span>
              <span className="flex items-center gap-2">
                <Timer className="size-4" /> 45 seconds, that's it
              </span>
            </div>
          </motion.div>

          {/* Hero visual: example analyzer card — demo values, clearly labeled as a preview */}
          <motion.div
            initial={{ opacity: 0, y: 36, rotate: 2.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.45 }}
            className="relative"
          >
            <div
              aria-hidden
              className="nb absolute -right-2.5 -top-2.5 h-full w-full rotate-2 bg-sun"
            />
            <NBPanel className="nb-shadow-lg relative self-center transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between border-b-2 border-ink bg-sun px-4 py-2.5">
                <span className="flex items-center gap-2 font-display text-sm">
                  <AudioWaveform className="size-4" /> Example read
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                  <motion.span
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="size-2 bg-coral nb"
                  />
                  Preview
                </span>
              </div>
              <div className="border-b-2 border-ink bg-mint px-4 py-1.5 text-[10px] font-bold tracking-wide text-ink/80">
                Sample analysis — your real read starts after you click Try your first read.
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

      {/* Trust badges */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {TRUST_BADGES.map((badge) => (
              <span key={badge} className="nb bg-secondary px-3 py-2">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop section */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Practice the tone that gets people to listen
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Most communication problems aren't about the words.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              ShiftedTone helps professionals hear how their voice lands before the next high-stakes conversation begins.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {VALUE_PROPS.map((item) => (
              <NBPanel key={item.title} className="h-full p-4">
                <div className="mb-3 h-1.5 w-10 bg-coral" />
                <p className="font-display text-lg leading-tight">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </NBPanel>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b-2 border-ink bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Turn a difficult conversation into a repeatable skill.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <NBPanel key={item.step} className="h-full p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {item.step}
                </p>
                <p className="mt-3 font-display text-2xl">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </NBPanel>
            ))}
          </div>
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

      {/* Testimonials */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Trusted by people who talk for a living
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              A sharper voice is a stronger outcome.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <NBPanel key={item.name} className="h-full p-5">
                <p className="text-base leading-relaxed text-ink">“{item.quote}”</p>
                <div className="mt-5 border-t-2 border-dashed border-ink/20 pt-4">
                  <p className="font-display text-lg">{item.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.title}
                  </p>
                </div>
              </NBPanel>
            ))}
          </div>
        </div>
      </section>

      {/* Quick routes: three doors into the site */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:grid-cols-3">
          {[
            {
              to: "/tone-check",
              title: "Find your default",
              body: "Three questions. One archetype. The drill built for it.",
              color: "bg-coral",
            },
            {
              to: "/drills",
              title: "See the drills",
              // Count stays honest as the catalog grows — rendered from the source of truth.
              body: `${DRILLS.length} real-world reps — calm, warmth, boundaries, recovery.`,
              color: "bg-mint",
            },
            {
              to: "/library",
              title: "Learn from the pros",
              body: "Research, talks, and guides from the people who study this for a living.",
              color: "bg-sun",
            },
          ].map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <Link
                to={card.to}
                className="group block h-full transition-transform duration-300 hover:-translate-y-1"
              >
                <NBPanel className="flex h-full flex-col p-5">
                  <span className={`h-1.5 w-10 ${card.color}`} />
                  <span className="mt-3 font-display text-lg leading-tight">
                    {card.title}
                  </span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {card.body}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-coral">
                    Explore
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </NBPanel>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b-2 border-ink bg-sun/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Simple pricing
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Pick the plan that matches your practice.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                subtitle: "For starting out",
                cta: "Start free",
                features: [
                  "3 tone checks per month",
                  "Access to starter drills",
                  "Track your progress",
                  "No audio saved by default",
                ],
                className: "bg-paper",
              },
              {
                name: "Pro",
                price: "$9",
                subtitle: "Per month",
                cta: "Go Pro",
                features: [
                  "Unlimited tone checks",
                  "Full drill library",
                  "AI coach notes after every take",
                  "Weekly progress insights",
                ],
                featured: true,
                className: "bg-mint",
              },
              {
                name: "Team pilot",
                price: "$49",
                subtitle: "Per seat / month",
                cta: "Book a pilot",
                features: [
                  "Shared team dashboard",
                  "Team progress tracking",
                  "Built for client-facing roles",
                  "Pilot support and onboarding",
                ],
                className: "bg-sun",
              },
            ].map((plan) => (
              <NBPanel
                key={plan.name}
                className={`flex h-full flex-col p-5 ${plan.className} ${
                  plan.featured ? "border-2 border-ink" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {plan.name}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-4xl">{plan.price}</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {plan.subtitle}
                      </span>
                    </div>
                  </div>
                  {plan.featured && (
                    <span className="nb bg-ink px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-paper">
                      Popular
                    </span>
                  )}
                </div>

                <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 size-2 bg-coral nb" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link to="/auth">
                    <NBButton variant={plan.featured ? "ink" : "paper"} className="w-full py-3">
                      {plan.cta}
                    </NBButton>
                  </Link>
                </div>
              </NBPanel>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              FAQ
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Questions people ask before they try it.
            </h2>
          </div>
          <div className="mt-8 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <NBPanel key={item.q} className="p-5">
                <p className="font-display text-xl">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </NBPanel>
            ))}
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
          <h2 className="max-w-2xl font-display text-3xl text-balance sm:text-4xl">
            The next hard conversation is already on your calendar. What{" "}
            <span className="italic">version of you</span> shows up?
          </h2>
          <p className="max-w-xl text-ink/70">
            It's free to start. The only equipment is the microphone you
            already own.
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
            <NBButton variant="ink" className="nb-shadow-lg px-8 py-4 text-lg">
              Start practicing free <ArrowRight className="size-5" />
            </NBButton>
          </Link>
        </div>
      </section>
      <PagePager />
    </PublicLayout>
  );
}
