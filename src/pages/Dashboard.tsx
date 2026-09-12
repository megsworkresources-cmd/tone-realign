import { NBBadge, NBButton, NBPanel, NBStat } from "@/components/nb";
import logo from "@/assets/logo.svg";
import { DRILLS } from "@/lib/drills";
import { TONE_LABELS } from "@/lib/tone-analyzer";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  Flame,
  History,
  LogOut,
  Mic,
  Shuffle,
  Timer,
  Trophy,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link, useNavigate } from "react-router";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const summary = useQuery(api.sessions.summary);
  const recentSessions = useQuery(api.sessions.listSessions, { limit: 6 });
  const reframeLogs = useQuery(api.reframes.list, { limit: 3 });
  const drillStats = useQuery(api.sessions.drillStats);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const bestByDrill = new Map(
    (drillStats ?? []).map((s) => [s.drill, s]),
  );

  return (
    <main className="min-h-screen bg-paper">
      {/* Header bar */}
      <header className="border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Tone Re:Align"
              width={36}
              height={36}
              className="nb size-9 bg-ink"
            />
            <span className="font-display text-lg">TONE RE:ALIGN</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-bold uppercase tracking-widest text-paper/70 sm:block">
              {user?.name ?? "Practitioner"}
            </span>
            <button
              onClick={handleSignOut}
              className="nb nb-press flex items-center gap-2 bg-coral px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        {/* Greeting + summary */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Your practice
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl">
                Welcome{user?.name ? `, ${user.name}` : " back"}
              </h1>
            </div>
            <NBBadge className="bg-mint">
              {summary?.streakDays
                ? `${summary.streakDays}-day streak`
                : "start a streak today"}
            </NBBadge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NBStat
              label="Takes"
              value={summary?.totalSessions ?? 0}
              className="bg-sun"
            />
            <NBStat
              label="Minutes voiced"
              value={summary?.totalMinutes ?? 0}
              suffix="min"
            />
            <NBStat
              label="Avg score"
              value={summary?.avgOverall ?? 0}
              className="bg-mint"
            />
            <NBStat
              label="Best score"
              value={summary?.bestOverall ?? 0}
              suffix={summary?.bestOverall ? "/100" : undefined}
            />
          </div>
        </section>

        {/* Drills */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Today's drills</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Mic on. One take at a time.
            </p>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {DRILLS.map((drill) => {
              const stats = bestByDrill.get(drill.id);
              return (
                <NBPanel key={drill.id} className="flex flex-col">
                  <div
                    className={`border-b-2 border-ink px-5 py-3 ${drill.color}`}
                  >
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
                      <Trophy className="size-3.5" />
                      {stats ? `Best ${stats.bestScore}` : "Untried"}
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

        {/* Reframe lab + history */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <NBPanel className="bg-ink text-paper">
            <div className="border-b-2 border-paper/20 p-6">
              <div className="flex items-center gap-2 font-display text-xl">
                <Shuffle className="size-5 text-sun" /> Reframe Lab
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-paper/80">
                Something set you off this week? Bring the trigger, see the
                automatic reaction, and practice the response that stays in
                alignment.
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-widest text-paper/60">
                {(reframeLogs ?? []).slice(0, 2).map((log) => (
                  <li key={log._id} className="truncate">
                    · {log.trigger}
                  </li>
                ))}
              </ul>
              <Link to="/reframe" className="mt-6 inline-block">
                <NBButton variant="sun" className="text-xs">
                  Open reframe lab <ArrowRight className="size-3.5" />
                </NBButton>
              </Link>
            </div>
          </NBPanel>

          <NBPanel>
            <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
              <div className="flex items-center gap-2 font-display text-xl">
                <History className="size-5" /> Recent takes
              </div>
            </div>
            <div className="flex flex-col">
              {recentSessions === undefined && (
                <p className="p-6 text-sm text-muted-foreground">Loading…</p>
              )}
              {recentSessions?.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">
                  No takes yet. Your first drill is one click away.
                </p>
              )}
              {recentSessions?.map((s) => (
                <div
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <NBBadge
                      className={
                        TONE_LABELS[s.dominantTone]?.color ?? "bg-secondary"
                      }
                    >
                      {TONE_LABELS[s.dominantTone]?.label ?? s.dominantTone}
                    </NBBadge>
                    <div>
                      <div className="text-sm font-bold">
                        {DRILLS.find((d) => d.id === s.drill)?.name ?? s.drill}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.wordsPerMinute} wpm · {s.avgPitchHz} Hz ·{" "}
                        {Math.round(s.voicedRatio * 100)}% voiced
                      </div>
                    </div>
                  </div>
                  <div className="font-display text-2xl">{s.overallScore}</div>
                </div>
              ))}
            </div>
          </NBPanel>
        </section>

        {/* Streak footer strip */}
        <section className="nb flex flex-wrap items-center justify-between gap-3 bg-mint px-5 py-4 nb-shadow">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <Flame className="size-4" />
            {summary?.streakDays
              ? `${summary.streakDays} day${summary.streakDays > 1 ? "s" : ""} in a row — keep the chain unbroken`
              : "One take today starts the chain"}
          </p>
          <Link to={`/practice/${DRILLS[0].id}`}>
            <NBButton variant="ink" className="text-xs">
              <Mic className="size-3.5" /> Take today's read
            </NBButton>
          </Link>
        </section>
      </div>
    </main>
  );
}
