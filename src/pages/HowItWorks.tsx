import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import { getDailyChallenge } from "@/lib/daily";
import {
  Activity,
  ArrowRight,
  Brain,
  Mic,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

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

export default function HowItWorks() {
  const daily = getDailyChallenge();

  return (
    <PublicLayout>
      {/* Header */}
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <NBBadge className="bg-sun text-ink">The method</NBBadge>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            How it <span className="italic text-coral">actually</span> works
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Self-awareness doesn't change anything on its own. Reps do. Every
            take is one.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="nb-grid border-b-2 border-ink bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <div className="grid gap-6 md:grid-cols-3">
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

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-muted-foreground">
              That's the whole loop. No lectures, no modules — just honest
              takes and straight scores until the calmer voice is the default.
            </p>
            <Link to="/auth">
              <NBButton variant="coral" className="px-6 py-3">
                Start the loop <ArrowRight className="size-4" />
              </NBButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Today's challenge teaser */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="nb flex flex-wrap items-center justify-between gap-4 bg-sun nb-shadow">
            <div className="flex items-center gap-4">
              <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Today's challenge is live
                </p>
                <p className="font-display text-lg leading-tight sm:text-xl">
                  {daily.drill.name} — {daily.angle.toLowerCase()}
                </p>
              </div>
            </div>
            <Link to="/drills">
              <NBButton variant="ink" className="text-xs">
                Meet the drills <ArrowRight className="size-3.5" />
              </NBButton>
            </Link>
          </div>
        </div>
      </section>
      <PagePager />
    </PublicLayout>
  );
}
