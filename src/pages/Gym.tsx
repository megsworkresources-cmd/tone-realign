import { NBButton, NBPanel } from "@/components/nb";
import { AppShell } from "@/components/AppShell";
import { DRILL_GROUPS, drillsInGroup } from "@/lib/drills";
import { getAccessibleDailyChallenge } from "@/lib/daily";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  MessagesSquare,
  Mic,
  Sparkles,
  Target,
  Timer,
  Lock,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link, useSearchParams } from "react-router";
import { cn } from "@/lib/utils";

/**
 * /gym — the training floor. One job: pick a drill and do it. The daily
 * challenge headlines, the whole catalog sits below with honest unlock
 * gates, and the no-mic practices live one callout away.
 */
export default function Gym() {
  const drillStats = useQuery(api.sessions.drillStats);
  const bestByDrill = new Map((drillStats ?? []).map((s) => [s.drill, s]));
  // Every drill is open — no locks, no gates. The daily challenge still
  // picks an accessible drill (all of them are).
  const daily = getAccessibleDailyChallenge(() => true);
  // One drill group per view — ?group= keeps the page short and the
  // choice simple; an unknown or missing group falls back to the first.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("group");
  const group = DRILL_GROUPS.find((g) => g.id === requested) ?? DRILL_GROUPS[0];
  const drills = drillsInGroup(group.id);

  return (
    <AppShell active="gym">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {/* Daily challenge */}
        <section className="nb relative overflow-hidden bg-sun nb-shadow">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Today's challenge
                </p>
                <h1 className="font-display text-xl leading-tight sm:text-2xl">
                  {daily.drill.name} — {daily.angle.toLowerCase()}
                </h1>
              </div>
            </div>
            <Link to={`/practice/${daily.drill.id}`}>
              <NBButton variant="ink" className="text-xs">
                <Mic className="size-3.5" /> Do today's take
              </NBButton>
            </Link>
          </div>
        </section>

        {/* The gym — one focused group at a time, honest locks */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">
              The <span className="italic text-coral">gym</span>
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pick one. Do it once.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Drill groups">
            {DRILL_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={g.id === group.id}
                onClick={() => setSearchParams(g.id === group.id ? {} : { group: g.id })}
                className={cn(
                  "nb nb-press px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                  g.id === group.id ? "bg-ink text-paper" : "bg-card text-ink",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{group.blurb}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {drills.map((drill) => {
              const s = bestByDrill.get(drill.id);
              return (
                <NBPanel key={drill.id} className="flex flex-col">
                  <div className={`border-b-2 border-ink px-5 py-3 ${drill.color}`}>
                    <div className="font-display text-lg leading-tight">
                      {drill.name}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">
                      {drill.tag}
                    </div>
                  </div>
                  <p className="flex-1 p-5 text-sm leading-relaxed text-muted-foreground">
                    {drill.focus}
                  </p>
                  <div className="flex items-center justify-between border-t-2 border-ink px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Timer className="size-3.5" /> {drill.seconds}s
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="size-3.5" />
                      {s ? `Best ${s.bestScore}` : "Untried"}
                    </span>
                  </div>
                  <Link to={`/practice/${drill.id}`} className="border-t-2 border-ink">
                    <NBButton variant="paper" className="w-full rounded-none py-2.5 text-xs">
                      Start drill <ArrowRight className="size-3.5" />
                    </NBButton>
                  </Link>
                </NBPanel>
              );
            })}
          </div>
        </section>

        {/* No-mic callout */}
        <section className="nb bg-ink text-paper">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <span className="nb flex size-11 shrink-0 items-center justify-center bg-card">
                <MessagesSquare className="size-5 text-sun" />
              </span>
              <div>
                <h2 className="font-display text-lg leading-tight">No mic handy?</h2>
                <p className="text-sm text-paper/70">
                  Read the Room trains the same judgment without recording.
                </p>
              </div>
            </div>
            <Link to="/quiz">
              <NBButton variant="sun" className="text-xs">
                Today's scenario <ArrowRight className="size-3.5" />
              </NBButton>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
