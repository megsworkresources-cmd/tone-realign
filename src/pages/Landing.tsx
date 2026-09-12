import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  Brain,
  Mic,
  Play,
  RefreshCcw,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { motion } from "framer-motion";
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
    body: "Pick a drill. Talk into your mic for 45 seconds — a real prompt, not a script.",
    color: "bg-sun",
  },
  {
    icon: Activity,
    title: "02 · See",
    body: "The analyzer reads pitch, pace, pressure and stability live, then scores your take.",
    color: "bg-mint",
  },
  {
    icon: Brain,
    title: "03 · Rewire",
    body: "Get the tone label, the coaching note, and drills that reprogram the default reaction.",
    color: "bg-coral",
  },
];

const DRILLS_PREVIEW = [
  {
    name: "Steady Ground",
    tag: "Calm under pressure",
    color: "bg-sun",
    body: "Describe a frustrating morning without complaint. Then ask for one fix.",
  },
  {
    name: "Warm Open",
    tag: "Warmth & presence",
    color: "bg-mint",
    body: "Greet someone you haven't seen in months and mean every word.",
  },
  {
    name: "Firm & Clear",
    tag: "Boundaries",
    color: "bg-coral",
    body: "Say no without trailing off. Hold the two-second silence after.",
  },
];

/** Curated external videos on tone, delivery, and regulated responses. */
const WATCH_LIST: {
  id: string;
  title: string;
  meta: string;
  color: string;
  minutes?: number;
}[] = [
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
];

function videoThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="nb-dots min-h-screen bg-paper">
      {/* Announcement strip */}
      <div className="border-b-2 border-ink bg-ink py-2 text-paper">
        <p className="text-center text-xs font-bold uppercase tracking-widest">
          Your voice reacts before you do — train it
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
            <div className="nb inline-flex items-center gap-2 bg-mint px-3 py-1 text-[11px] font-bold uppercase tracking-widest nb-shadow-sm">
              <AudioWaveform className="size-4" />
              The voice tone gym
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              Don't say the{" "}
              <span className="nb bg-sun px-2 inline-block -rotate-1">wrong thing</span>
              . Train the{" "}
              <span className="nb bg-mint px-2 inline-block rotate-1">tone</span> that
              says it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              ShiftedTone listens to how you speak — pitch, pace, pressure,
              stability — scores it, and coaches you to reprogram the automatic
              reactions that leak into every hard conversation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/auth">
                <NBButton variant="sun" className="px-6 py-3 text-base">
                  Take your first read <ArrowRight className="size-4" />
                </NBButton>
              </Link>
              <a href="#how">
                <NBButton variant="paper" className="px-6 py-3 text-base">
                  See how it works
                </NBButton>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> Audio never leaves your device
              </span>
              <span className="flex items-center gap-2">
                <Timer className="size-4" /> 45-second takes
              </span>
            </div>
          </motion.div>

          {/* Hero visual: live analyzer card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <NBPanel className="nb-shadow-lg self-center transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between border-b-2 border-ink bg-sun px-4 py-2.5">
                <span className="flex items-center gap-2 font-display text-sm">
                  <Mic className="size-4" /> Live read
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                  <span className="size-2 bg-coral nb" /> Rec
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
                  {[
                    ["Tone", "Calm", "bg-mint"],
                    ["Pace", "126 wpm", "bg-paper"],
                    ["Pitch", "Stable", "bg-paper"],
                  ].map(([k, v, c]) => (
                    <div key={k} className={`nb p-2.5 ${c}`}>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {k}
                      </div>
                      <div className="font-display text-sm">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 nb bg-secondary p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Coach note
                  </p>
                  <p className="mt-1 text-sm">
                    "Good pressure control. Let the last word land — don't push
                    through the pause."
                  </p>
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
              <span className="inline-block size-2 bg-sun" />
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
              The loop that rewires
            </motion.h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Reaction reprogramming isn't insight — it's reps. Every take is a
              measurable rep with feedback you can feel.
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
                <NBPanel className="h-full">
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
              Three drills. One default voice.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Each drill targets a tone mode you'll actually need: calm under
              pressure, warmth on purpose, and a no that holds.
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

      {/* Watch & learn */}
      <section id="watch" className="nb-stripes border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <NBBadge className="bg-sun text-ink">Watch & learn</NBBadge>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                Then hear it from the pros
              </h2>
            </div>
            <p className="max-w-md text-sm text-paper/70">
              ShiftedTone gives you the reps. These are the ideas — hand-picked
              videos on tone, delivery, and keeping conversations alive.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WATCH_LIST.map((video, i) => (
              <motion.a
                key={video.id}
                href={`https://youtu.be/${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group block"
              >
                <NBPanel className="h-full overflow-hidden border-paper text-paper transition-transform duration-300 group-hover:-translate-y-1.5">
                  <div className="relative border-b-2 border-ink">
                    <img
                      src={videoThumb(video.id)}
                      alt={video.title}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
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
            ))}
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
                Catch it. Reframe it. Rehearse it.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                The reframe lab is where reaction reprogramming happens. Write
                the trigger that set you off and what you almost said. The coach
                hands you the version of you that stays in alignment — and the
                delivery note for how to say it out loud.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "Name the trigger without judgment",
                  "See the automatic reaction on paper",
                  "Get a grounded alternative, in your voice",
                  "Rehearse it with the tone drill",
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
            <NBPanel className="self-center transition-transform duration-300 hover:-translate-y-1">
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
                  "Great, what now." Heart racing, typing a defensive paragraph.
                </p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Reframed response
                </p>
                <p className="nb mt-1.5 bg-mint p-3 text-sm font-medium">
                  "Happy to talk — send over the agenda so I can come prepared."
                </p>
                <div className="mt-3 nb bg-sun p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Delivery note
                  </p>
                  <p className="mt-1 text-sm">
                    Flat, warm, unhurried. You're asking for logistics, not
                    permission.
                  </p>
                </div>
              </div>
            </NBPanel>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="nb-rays border-b-2 border-ink bg-sun">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center lg:py-20">
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">
            The next conversation is already scheduled. How will you sound?
          </h2>
          <p className="max-w-xl text-ink/70">
            Free to start. No equipment but the microphone you already own.
          </p>
          <Link to="/auth">
            <NBButton variant="ink" className="px-8 py-4 text-lg">
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
            Train the tone. Keep the truth.
          </p>
        </div>
      </footer>
    </div>
  );
}
