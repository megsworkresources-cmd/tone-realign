import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { getDrill } from "@/lib/drills";
import { videoThumb, type WatchVideo } from "@/lib/watch-list";
import { ArrowRight, ArrowUpRight, Mic, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

/**
 * One curated video card: thumbnail → YouTube, meta, and — when the
 * video maps to a drill — the "Train it" bridge into the app.
 *
 * `defer` renders the card without entrance motion (landing sections
 * use it when the surrounding section already animates as a whole).
 */
export function VideoCard({ video }: { video: WatchVideo }) {
  const drill = getDrill(video.practice);
  return (
    <div className="flex flex-col">
      <motion.a
        href={`https://youtu.be/${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -4 }}
        className="group block"
      >
        <NBPanel className="overflow-hidden border-paper bg-ink text-paper">
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
            <h2 className="font-display text-sm leading-snug">{video.title}</h2>
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
    </div>
  );
}

/**
 * The full "Watch & learn" videos section: dark strip, staggered card
 * entrance, one "See all N videos" link pointing deeper into the site.
 * Used by the landing page (first six videos) and the Library (all).
 */
export function WatchLearnSection({
  videos,
  heading = "Watch & learn",
  subheading = "Real techniques from the people who coach this for a living — and the drill that lets you practice each one out loud.",
  seeAll,
}: {
  videos: WatchVideo[];
  /** Section title (default "Watch & learn"). */
  heading?: string;
  /** Standfirst paragraph (default covers the technique + drill pairing). */
  subheading?: string;
  /** Renders a "See all" button — shown only where it leads somewhere new. */
  seeAll?: { to: string; label: string };
}) {
  return (
    <section className="nb-stripes border-b-2 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <NBBadge className="bg-coral text-ink">Video</NBBadge>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              {heading}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-paper/60">
            {subheading}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <VideoCard video={video} />
            </motion.div>
          ))}
        </div>

        {seeAll && (
          <div className="mt-8 flex justify-center">
            <Link to={seeAll.to}>
              <NBButton variant="paper" className="px-6 py-3 text-base">
                {seeAll.label} <ArrowRight className="size-4" />
              </NBButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
