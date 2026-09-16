import { NBBadge, NBButton, NBPanel, NBStat } from "@/components/nb";
import { AppShell, LevelRing } from "@/components/AppShell";
import { DailyChecklist } from "@/components/DailyChecklist";
import { GroundingKit } from "@/components/GroundingKit";
import { DRILLS } from "@/lib/drills";
import { dailyLabel, getAccessibleDailyChallenge } from "@/lib/daily";
import { arcDaysLeft, arcStageFor } from "@/lib/arc";
import {
  ACHIEVEMENTS,
  levelInfo,
  type AchievementStats,
} from "@/lib/gamify";
import {
  UNLOCKABLE_DRILLS,
  TRENDS_UNLOCK,
  isUnlocked,
  unlockGoalLine,
  unlockProgressPct,
  nextUnlock,
  buildToneTrends,
  type UnlockStats,
  type NextUnlock,
} from "@/lib/unlocks";
import { TONE_LABELS } from "@/lib/tone-analyzer";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  History,
  Languages,
  Lock,
  MessagesSquare,
  Mic,
  Minus,
  Shuffle,
  Sparkles,
  Timer,
  TrendingDown,
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
  const trendSessions = useQuery(api.sessions.listSessions, { limit: 10 });
  const reframeLogs = useQuery(api.reframes.list, { limit: 2 });
  const drillStats = useQuery(api.sessions.drillStats);

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
    drills: progression?.drills ?? DRILLS.length,
  };
  const earned = new Set(
    ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id),
  );

  // Progressive unlocks: what's open, and the one next goal to chase.
  const unlockStats: UnlockStats = {
    takes: stats.totalSessions,
    level: level.level,
    drillsTried: stats.drillsTried,
    bestScore: stats.bestOverall,
    streak: stats.streakDays,
  };
  const next = nextUnlock(unlockStats);
  const trendsUnlocked = isUnlocked(TRENDS_UNLOCK, unlockStats);

  // The daily CTA must always be runnable: when the calendar pick sits
  // behind a lock, swap it for a starter so the headline button and the
  // checklist's "One honest take" never dead-end on the lock screen.
  const daily = getAccessibleDailyChallenge((drillId) => {
    const gate = UNLOCKABLE_DRILLS.find((u) => u.id === drillId);
    return !gate || isUnlocked(gate, unlockStats);
  });

  const maxWeekXp = Math.max(1, ...(progression?.week ?? []).map((w) => w.xp));
  const weekBars = (progression?.week ?? []).map((w) => ({
    ...w,
    label: DAY_LETTERS[new Date(w.day.replace(/-/g, "/")).getDay()],
    h: Math.round((w.xp / maxWeekXp) * 100),
  }));

  return (
    <AppShell active="dashboard">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
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

        {/* Daily challenge + next unlock — the two live goals, side by side */}
        <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="nb relative overflow-hidden bg-sun nb-shadow">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                  <Sparkles className="size-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Today's challenge
                  </p>
                  <h2 className="font-display text-lg leading-tight sm:text-xl">
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
          </div>
          {next && <NextUnlockPanel next={next} />}
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

        {/* Achievements — collapsed by default so the shelf rewards a visit
            instead of adding another wall of cards to scroll past */}
        <details className="nb group bg-card nb-shadow">
          <summary className="flex cursor-pointer list-none items-center justify-between border-b-2 border-ink px-6 py-4 [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2 font-display text-xl">
              <Trophy className="size-5" /> Trophy shelf
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {earned.size} of {ACHIEVEMENTS.length} earned
              </span>
            </div>
            <span
              aria-hidden
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-transform group-open:rotate-180"
            >
              open ▼
            </span>
          </summary>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </details>

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
              const gate = UNLOCKABLE_DRILLS.find((u) => u.id === drill.id);
              const open = !gate || isUnlocked(gate, unlockStats);
              return (
                <NBPanel key={drill.id} className={open ? "flex flex-col" : "flex flex-col bg-card/60"}>
                  <div className={`border-b-2 border-ink px-5 py-3 ${drill.color} ${open ? "" : "opacity-60"}`}>
                    <div className="flex items-center justify-between font-display text-lg leading-tight">
                      {drill.name}
                      {!open && <Lock className="size-4" />}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">
                      {drill.tag}
                    </div>
                  </div>
                  {open ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <p className="flex-1 p-5 text-sm leading-relaxed text-muted-foreground">
                        {gate!.blurb}
                      </p>
                      <div className="border-t-2 border-ink px-5 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Unlocks with
                        </p>
                        <p className="mt-0.5 text-sm font-bold">{unlockGoalLine(gate!, unlockStats)}</p>
                      </div>
                      <div className="h-1.5 border-t-2 border-ink bg-muted">
                        <div
                          className="h-full bg-sun"
                          style={{ width: `${unlockProgressPct(gate!, unlockStats)}%` }}
                        />
                      </div>
                    </>
                  )}
                </NBPanel>
              );
            })}
          </div>
        </section>

        {/* Rituals — grounding first, then the no-mic practices */}
        <section className="grid gap-6 lg:grid-cols-3">
          <GroundingKit />
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

        {/* Tone trends — unlocked after 5 takes; trends need history */}
        {trendsUnlocked && trendSessions && trendSessions.length >= 2 && (
          <ToneTrendsPanel sessions={trendSessions} />
        )}

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
 * The single next unlock: what's behind the lock, the one reachable
 * to-do, and progress toward it. This is the return hook — there is
 * always a visible "do this next" on the dashboard.
 */
function NextUnlockPanel({ next }: { next: NextUnlock }) {
  return (
    <div className="nb bg-card nb-shadow">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <span className="nb flex size-11 shrink-0 items-center justify-center bg-ink text-paper">
            <Lock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Next unlock
            </p>
            <h2 className="font-display text-xl leading-tight">{next.item.name}</h2>
            <p className="text-sm text-muted-foreground">{next.item.blurb}</p>
          </div>
        </div>
        <div className="min-w-[220px] flex-1 sm:max-w-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span>{next.goal || "Keep practicing"}</span>
            <span>{next.progressPct}%</span>
          </div>
          <div className="mt-2 h-3 w-full border-2 border-ink bg-muted">
            <div className="h-full bg-mint" style={{ width: `${next.progressPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tone trends — the first feature that unlocks with practice. Per-factor
 * direction over the last 10 takes: which way each score is moving.
 */
function ToneTrendsPanel({
  sessions,
}: {
  sessions: {
    _id: string;
    calmScore: number;
    energyScore: number;
    clarityScore: number;
    stabilityScore: number;
  }[];
}) {
  // listSessions returns newest-first; trends read oldest → newest.
  const rows = buildToneTrends([...sessions].reverse());
  const icons = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;
  const colors = {
    up: "text-mint",
    down: "text-coral",
    flat: "text-muted-foreground",
  } as const;

  return (
    <section className="nb bg-card nb-shadow">
      <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
        <div className="flex items-center gap-2 font-display text-xl">
          <TrendingUp className="size-5" /> Tone trends
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          last {rows[0]?.scores.length ?? 0} takes
        </p>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const Icon = icons[r.direction];
          return (
            <div key={r.label} className="nb bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest">{r.label}</span>
                <Icon className={cn("size-4", colors[r.direction])} />
              </div>
              <div className="mt-1 font-display text-2xl">
                {r.scores[r.scores.length - 1]}
                {r.delta !== 0 && (
                  <span
                    className={cn(
                      "ml-2 text-xs font-bold",
                      r.direction === "up" ? "text-mint" : r.direction === "down" ? "text-coral" : "text-muted-foreground",
                    )}
                  >
                    {r.delta > 0 ? "+" : ""}{r.delta}
                  </span>
                )}
              </div>
              <div className="mt-2 flex h-8 items-end gap-1" aria-hidden>
                {r.scores.map((v, i) => (
                  <div
                    key={i}
                    title={`${r.label} ${v}`}
                    className="min-w-[3px] flex-1 bg-ink/70"
                    style={{ height: `${Math.max(v, 4)}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
