import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { WATCH_LIST, videoThumb } from "@/lib/watch-list";
import { READING_LIST } from "@/lib/reading-list";
import { getDrill } from "@/lib/drills";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Mic,
  Play,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

export default function Library() {
  return (
    <PublicLayout>
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <NBBadge className="bg-sun text-ink">The library</NBBadge>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Ideas from the <span className="italic text-sun">pros</span>.
            Reps from you.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Every video here ends the same way: with a drill underneath it.
            Watch the idea, then use your own voice to make it stick.
          </p>
        </div>
      </section>

      {/* Videos */}
      <section className="nb-stripes border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WATCH_LIST.map((video, i) => {
              const drill = getDrill(video.practice);
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
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
                        <h2 className="font-display text-sm leading-snug">
                          {video.title}
                        </h2>
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
        </div>
      </section>

      {/* Go deeper — the research shelf */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <NBBadge className="bg-mint text-ink">Go deeper</NBBadge>
              <h2 className="mt-4 flex items-center gap-2 font-display text-3xl sm:text-4xl">
                <BookOpen className="size-6 text-coral" /> The research shelf
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Books, talks, and studies from the people whose work this app
              stands on. Every link goes to the author — no aggregators, no
              sign-up.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                className="group flex items-start gap-4 border-2 border-ink/15 bg-card p-4 text-ink transition-colors hover:border-ink hover:bg-paper"
              >
                <span className={`mt-1 h-10 w-1.5 shrink-0 ${r.color}`} />
                <span className="min-w-0 flex-1">
                  <span className="font-display text-sm leading-snug">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-coral">
                    {r.source}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                    {r.blurb}
                  </span>
                </span>
                <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-sun">
        <div
          aria-hidden
          className="nb-rays nb-spin-slow pointer-events-none absolute -inset-[60%]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center">
          <h2 className="max-w-2xl font-display text-3xl text-balance sm:text-4xl">
            Ideas are the warm-up. <span className="italic">Reps</span> are the
            workout.
          </h2>
          <Link to="/auth">
            <NBButton variant="ink" className="px-8 py-4 text-lg">
              Start practicing free <ArrowRight className="size-5" />
            </NBButton>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
