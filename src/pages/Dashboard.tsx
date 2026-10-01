import { NBButton, NBPanel, NBStat } from "@/components/nb";
import { AppShell } from "@/components/AppShell";
import { DailyChecklist } from "@/components/DailyChecklist";
import { dailyLabel, getAccessibleDailyChallenge } from "@/lib/daily";
import { GROUNDING_EXERCISES } from "@/lib/grounding";
import { api } from "@/convex/_generated/api";
import {
  Languages,
  MessagesSquare,
  Mic,
  Shuffle,
  Sparkles,
  TrendingUp,
  Wind,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link } from "react-router";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * /dashboard — the day at a glance. Today's numbers, today's goals,
 * today's checklist. Training lives in /gym, the record in /progress,
 * the calm side in /calm — this page just orients.
 */
export default function Dashboard() {
  const progression = useQuery(api.dailyLog.progression);

  // Stats drive every panel here (level, unlocks, checklist, next-unlock);
  // render only once they've loaded so a veteran never sees a zeros-frame.
  if (progression === undefined) {
    return (
      <AppShell active="dashboard">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <NBPanel className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Loading your day…</p>
          </NBPanel>
        </div>
      </AppShell>
    );
  }

  const stats = {
    totalSessions: progression?.totalSessions ?? 0,
    streakDays: progression?.streakDays ?? 0,
    bestOverall: progression?.bestOverall ?? 0,
    drillsTried: progression?.drillsTried ?? 0,
  };

  const maxWeekXp = Math.max(1, ...(progression?.week ?? []).map((w) => w.xp));
  const weekBars = (progression?.week ?? []).map((w) => ({
    ...w,
    label: DAY_LETTERS[new Date(w.day.replace(/-/g, "/")).getDay()],
    h: Math.round((w.xp / maxWeekXp) * 100),
  }));

  // No locks anywhere — every drill is open, so the daily pick is always
  // runnable.
  const daily = getAccessibleDailyChallenge(() => true);

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
              Your day at a glance
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NBStat label="Takes" value={stats.totalSessions} className="bg-sun" />
            <NBStat label="Streak" value={stats.streakDays} suffix="d" className="bg-mint" />
            <NBStat
              label="Best score"
              value={stats.bestOverall}
              suffix={stats.bestOverall ? "/100" : undefined}
            />
          </div>
        </section>

        {/* Quick reps — every tool one tap away */}
        <section aria-label="Quick reps">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { to: "/gym", icon: Mic, label: "Quick take", sub: "45s", color: "bg-coral" },
              { to: "/translate", icon: Languages, label: "Translate", sub: "2 passes", color: "bg-sun" },
              { to: "/quiz", icon: MessagesSquare, label: "Read the Room", sub: "1 scenario", color: "bg-mint" },
              { to: "/reframe", icon: Shuffle, label: "Reframe", sub: "2 min", color: "bg-paper" },
              { to: "/calm", icon: Wind, label: "Grounding", sub: `${GROUNDING_EXERCISES.length} exercises`, color: "bg-paper" },
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

        {/* Today's two moves: challenge + checklist, side by side */}
        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="nb relative overflow-hidden bg-sun nb-shadow">
            <div className="flex h-full flex-col justify-between gap-4 p-5">
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
              <p className="text-sm text-ink/70">
                About {daily.drill.seconds} seconds. Your microphone will
                turn on when you start.
              </p>
              <div>
                <Link to={`/practice/${daily.drill.id}`}>
                  <NBButton variant="ink" className="text-xs">
                    <Mic className="size-3.5" /> Do today's take
                  </NBButton>
                </Link>
              </div>
            </div>
          </div>
          <DailyChecklist todayDrillId={daily.drill.id} />
        </section>

        {/* This week — one simple chart, no points or levels */}
        <section id="progress" className="grid gap-6 lg:grid-cols-2">

          {/* Practice this week — one bar per day */}
          <NBPanel className="flex flex-col overflow-hidden">
            <div className="border-b-2 border-ink p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Practice — last 7 days
                </p>
              </div>
              <div className="mt-3 flex h-24 items-end gap-2">
                {weekBars.map((b, i) => (
                  <div key={b.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      aria-hidden
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
            <div className="flex flex-1 items-center justify-between border-t-2 border-ink p-4">
              <p className="text-xs text-muted-foreground">
Your full history lives on the Progress page.
              </p>
              <Link
                to="/progress"
                className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-coral hover:underline"
              >
                <TrendingUp className="size-3.5" /> Progress
              </Link>
            </div>
          </NBPanel>
        </section>
      </div>
    </AppShell>
  );
}
