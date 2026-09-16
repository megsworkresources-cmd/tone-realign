import { NBBadge, NBButton, NBPanel, NBStat } from "@/components/nb";
import { AppShell, LevelRing } from "@/components/AppShell";
import { DailyChecklist } from "@/components/DailyChecklist";
import { BreathReset } from "@/components/BreathReset";
import { DRILLS } from "@/lib/drills";
import { dailyLabel, getDailyChallenge } from "@/lib/daily";
import { arcDaysLeft, arcStageFor } from "@/lib/arc";
import {
  ACHIEVEMENTS,
  levelInfo,
  type AchievementStats,
} from "@/lib/gamify";
import { TONE_LABELS } from "@/lib/tone-analyzer";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  History,
  Languages,
  Lock,
  MessagesSquare,
  Mic,
  Shuffle,
  Sparkles,
  Timer,
  TrendingUp,
  Trophy,
  Wind,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NBMeter } from "@/components/nb";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export default function Dashboard() {
  const progression = useQuery(api.dailyLog.progression);
  const recentSessions = useQuery(api.sessions.listSessions, { limit: 5 });
  const reframeLogs = useQuery(api.reframes.list, { limit: 2 });
  const drillStats = useQuery(api.sessions.drillStats);

  const daily = getDailyChallenge();
  const level = levelInfo(progression?.totalXp ?? 0);
  const bestByDrill = new Map((drillStats ?? []).map((s) => [s.drill, s]));

  const stats: AchievementStats = {
    totalSessions: progression?.totalSessions ?? 0,
    totalMinutes: progression?.totalMinutes ?? 0,
    bestOverall: progression?.bestOverall ?? 0,
    totalQuiz: progression?.totalQuiz ?? 0,
    totalReframes: progression?.totalReframes ?? 0,
    totalResets: progression?.totalResets ?? 0,
    streakDays: progression?.streakDays ?? 0,
    drillsTried: progression?.drillsTried ?? 0,
    drills: progression?.drills ?? 5,
  };
  const earned = new Set(
    ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id),
  );

  const maxWeekXp = Math.max(1, ...(progression?.week ?? []).map((w) => w.xp));
  const weekBars = (progression?.week ?? []).map((w) => ({
    ...w,
    label: DAY_LETTERS[new Date(w.day.replace(/-/g, "/")).getDay()],
    h: Math.round((w.xp / maxWeekXp) * 100),
  }));

  return (
    <AppShell active="dashboard">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        {/* Greeting + headline stats */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {dailyLabel()} · your practice
            </p>
            <h1 className="mt-1 font-display text-3xl text-balance sm:text-4xl">
              {level.label}{" "}
              <span className="text-muted-foreground">· level {level.level}</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NBStat label="Total XP" value={progression?.totalXp ?? 0} className="bg-sun" />
            <NBStat label="Takes" value={progression?.totalSessions ?? 0} />
            <NBStat label="Streak" value={progression?.streakDays ?? 0} suffix="d" className="bg-mint" />
            <NBStat
              label="Best score"
              value={progression?.bestOverall ?? 0}
              suffix={progression?.bestOverall ? "/100" : undefined}
            />
            </div>
        </section>

        {/* Quick reps — every tool one tap away */}
        <section aria-label="Quick reps">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { to: `/practice/${daily.drill.id}`, icon: Mic, label: "Quick take", sub: "45s", color: "bg-coral" },
              { to: "/translate", icon: Languages, label: "Translate", sub: "2 passes", color: "bg-sun" },
              { to: "/quiz", icon: MessagesSquare, label: "Read the Room", sub: "1 scenario", color: "bg-mint" },
              { to: "/reframe", icon: Shuffle, label: "Reframe", sub: "2 min", color: "bg-paper" },
              { to: "/dashboard#breath", icon: Wind, label: "Breath reset", sub: "90s", color: "bg-paper" },
            ].map((rep) => {
              const Icon = rep.icon;
              return (
                <Link
                  key={rep.label}
                  to={rep.to}
                  className="group nb nb-press flex items-center gap-3 bg-card p-3"
                >
                  <span className={`nb flex size-9 shrink-0 items-center justify-center ${rep.color}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold leading-tight">{rep.label}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {rep.sub}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 21-day arc — where you are in the reprogramming program */}
        <ArcPanel streakDays={stats.streakDays} />

        {/* Daily challenge */}
        <section className="nb relative overflow-hidden bg-sun nb-shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Today's challenge
                </p>
                <h2 className="font-display text-xl leading-tight sm:text-2xl">
                  {daily.drill.name} — {daily.angle.toLowerCase()}
                </h2>
              </div>
            </div>
            <Link to={`/practice/${daily.drill.id}`}>
              <NBButton variant="ink" className="text-xs">
                <Mic className="size-3.5" /> Do today's take
              </NBButton>
            </Link>
          </div>
        </section>

        {/* Checklist + progression center */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <DailyChecklist todayDrillId={daily.drill.id} />

          <NBPanel className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-ink px-5 py-3">
              <div className="font-display text-xl">Progression</div>
              <NBBadge className="bg-coral">
                {level.maxed ? "Top tier" : `${level.xpToNext} XP to ${level.nextLabel}`}
              </NBBadge>
            </div>
            <div className="flex items-center gap-5 p-5">
              <div className="scale-[2.1]">
                <LevelRing level={level.level} pct={level.progressPct} />
              </div>
              <div className="min-w-0">
                <div className="font-display text-2xl">{level.label}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {level.into}
                  {level.needed > 0 ? ` / ${level.needed}` : ""} XP this level
                </div>
                <div className="mt-3 flex h-4 gap-[3px]" aria-hidden>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`flex-1 ${
                        i < Math.round((level.progressPct / 100) * 10) ? "bg-coral" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {/* Weekly XP chart */}
            <div className="border-t-2 border-ink p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Last 7 days
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {progression?.todayXp ?? 0} XP today
                </p>
              </div>
              <div className="mt-3 flex h-20 items-end gap-2">
                {weekBars.map((b, i) => (
                  <div key={b.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      title={`${b.xp} XP`}
                      className={`w-full ${i === weekBars.length - 1 ? "bg-coral" : "bg-ink"}`}
                      style={{ height: `${Math.max(b.h, 4)}%` }}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </NBPanel>
        </section>

        {/* Achievements */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">
              Trophy <span className="italic text-coral">shelf</span>
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {earned.size} of {ACHIEVEMENTS.length} earned
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const has = earned.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`nb flex items-start gap-3 p-3 ${has ? "bg-card" : "bg-card/50"}`}
                >
                  <span
                    className={`nb flex size-9 shrink-0 items-center justify-center ${
                      has
                        ? a.tier === "gold"
                          ? "bg-sun"
                          : a.tier === "silver"
                            ? "bg-mint"
                            : "bg-coral"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {has ? <Trophy className="size-4" /> : <Lock className="size-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{a.name}</span>
                    <span className="block text-xs text-muted-foreground">{a.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Drills */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">
              The <span className="italic text-coral">gym</span>
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Mic on. One honest take at a time.
            </p>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {DRILLS.map((drill) => {
              const s = bestByDrill.get(drill.id);
              return (
                <NBPanel key={drill.id} className="flex flex-col">
                  <div className={`border-b-2 border-ink px-5 py-3 ${drill.color}`}>
                    <div className="font-display text-lg leading-tight">{drill.name}</div>
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

        {/* Rituals */}
        <section className="grid gap-6 lg:grid-cols-3">
          <BreathReset />
          <NBPanel className="bg-ink text-paper">
            <div className="border-b-2 border-paper/20 p-6">
              <div className="flex items-center gap-2 font-display text-xl">
                <MessagesSquare className="size-5 text-sun" /> Read the Room
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-paper/80">
                No mic needed. Pick the reply you'd actually send and see what
                it would broadcast — new scenario every day.
              </p>
              <Link to="/quiz" className="mt-6 inline-block">
                <NBButton variant="sun" className="text-xs">
                  Today's scenario <ArrowRight className="size-3.5" />
                </NBButton>
              </Link>
            </div>
          </NBPanel>
          <NBPanel className="bg-ink text-paper">
            <div className="border-b-2 border-paper/20 p-6">
              <div className="flex items-center gap-2 font-display text-xl">
                <Shuffle className="size-5 text-sun" /> Reframe Lab
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-paper/80">
                Something get under your skin? Look at what you almost said,
                then write the version you'd rather have said.
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-widest text-paper/60">
                {(reframeLogs ?? []).map((log) => (
                  <li key={log._id} className="truncate">· {log.trigger}</li>
                ))}
              </ul>
              <Link to="/reframe" className="mt-6 inline-block">
                <NBButton variant="sun" className="text-xs">
                  Open reframe lab <ArrowRight className="size-3.5" />
                </NBButton>
              </Link>
            </div>
          </NBPanel>
        </section>

        {/* Recent takes */}
        <section className="nb bg-card nb-shadow">
          <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
            <div className="flex items-center gap-2 font-display text-xl">
              <History className="size-5" /> Recent takes
            </div>
            <Link
              to={`/practice/${daily.drill.id}`}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-ink"
            >
              Add one →
            </Link>
          </div>
          <div className="flex flex-col">
            {recentSessions === undefined && (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            )}
            {recentSessions?.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                Nothing here yet. Your first take is one click away.
              </p>
            )}
            {recentSessions?.map((s) => (
              <RecentTakeRow key={s._id} session={s} best={bestByDrill.get(s.drill)} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/**
 * One recent take: tone badge, drill, live metrics, and your delta vs.
 * that drill's best — expandable to the four factor scores so the log
 * reads as progress, not a pile of numbers.
 */
function RecentTakeRow({
  session: s,
  best,
}: {
  session: {
    _id: string;
    drill: string;
    overallScore: number;
    calmScore: number;
    energyScore: number;
    clarityScore: number;
    stabilityScore: number;
    wordsPerMinute: number;
    avgPitchHz: number;
    voicedRatio: number;
    dominantTone: string;
  };
  best?: { bestScore: number; attemptCount: number };
}) {
  const [open, setOpen] = useState(false);
  const delta = best ? s.overallScore - best.bestScore : null;
  const isNewBest = delta !== null && delta > 0;

  const factors = [
    { label: "Calm", score: s.calmScore },
    { label: "Energy", score: s.energyScore },
    { label: "Clarity", score: s.clarityScore },
    { label: "Stability", score: s.stabilityScore },
  ];

  return (
    <div className="border-b border-ink/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-secondary/60"
      >
        <div className="flex items-center gap-3">
          <NBBadge className={TONE_LABELS[s.dominantTone]?.color ?? "bg-secondary"}>
            {TONE_LABELS[s.dominantTone]?.label ?? s.dominantTone}
          </NBBadge>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold">
              {DRILLS.find((d) => d.id === s.drill)?.name ?? s.drill}
              {isNewBest && (
                <NBBadge className="bg-sun">
                  <TrendingUp className="size-3" /> new best
                </NBBadge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {s.wordsPerMinute} wpm · {s.avgPitchHz} Hz ·{" "}
              {Math.round(s.voicedRatio * 100)}% voiced
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {delta !== null && (
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-widest",
                delta > 0 ? "text-mint" : delta < 0 ? "text-muted-foreground" : "text-ink",
              )}
            >
              {delta > 0 ? `+${delta} vs best` : delta < 0 ? `${delta} vs best` : "= best"}
            </span>
          )}
          <div className="font-display text-2xl">{s.overallScore}</div>
          <span
            aria-hidden
            className={cn(
              "text-[10px] font-bold text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          >
            ▼
          </span>
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-3 border-t border-dashed border-ink/20 bg-secondary/50 px-6 py-4 sm:grid-cols-4">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {f.label}
                </span>
                <span className="font-display text-lg">{f.score}</span>
              </div>
              <NBMeter value={f.score} className="mt-1 h-2" barClassName="bg-ink" />
            </div>
          ))}
        </div>
      )}
    </div>
  );}

/**
 * The 21-day reprogramming arc: your streak maps onto a three-week
 * program (floor → range → translation), so coming back isn't just a
 * checklist — it's a curriculum with a finish line.
 */
function ArcPanel({ streakDays }: { streakDays: number }) {
  const day = Math.max(1, streakDays);
  const stage = arcStageFor(day);
  const left = arcDaysLeft(day);
  const dayPct = Math.min(100, Math.round((day / 21) * 100));

  return (
    <NBPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-ink bg-mint px-5 py-3">
        <div className="font-display">The 21-day reprogramming arc</div>
        <NBBadge className="bg-ink text-paper">
          {left > 0 ? `${left} day${left === 1 ? "" : "s"} to go` : "Arc complete — keep the streak"}
        </NBBadge>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-5">
          <div className="nb flex size-14 shrink-0 flex-col items-center justify-center bg-card">
            <span className="font-display text-xl leading-none">{day}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">day</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg">{stage.name}</span>
              <span className="text-xs text-muted-foreground">· {stage.promise}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-bold text-ink">Today's move:</span> {stage.move}
            </p>
          </div>
        </div>

        {/* Stage track: three blocks across 21 days */}
        <div className="mt-4 flex gap-1" aria-hidden>
          {Array.from({ length: 21 }).map((_, i) => {
            const d = i + 1;
            const s = arcStageFor(d);
            const isStage = s.id === stage.id;
            const isDone = d <= day;
            return (
              <span
                key={i}
                title={`Day ${d} — ${s.name}`}
                className={`h-3 flex-1 border border-ink ${
                  isDone ? (isStage ? "bg-ink" : "bg-muted") : "bg-card"
                }`}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{stage.why}</p>
        <div className="mt-3 h-1.5 bg-muted">
          <div className="h-full bg-ink" style={{ width: `${dayPct}%` }} />
        </div>
      </div>
    </NBPanel>
  );
}
