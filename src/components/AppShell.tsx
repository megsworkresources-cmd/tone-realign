import { levelInfo } from "@/lib/gamify";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import { LayoutDashboard, LogOut, MessagesSquare, Shuffle } from "lucide-react";
import { useQuery } from "convex/react";
import { Link, useNavigate } from "react-router";
import type { ReactNode } from "react";

/** The signed-in app's shared chrome: one header, consistent nav, live level. */
export function AppShell({
  active,
  children,
}: {
  active?: "dashboard" | "quiz" | "reframe" | "practice";
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const progression = useQuery(api.dailyLog.progression);

  const level = levelInfo(progression?.totalXp ?? 0);

  const NAV = [
    { id: "dashboard", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "quiz", to: "/quiz", label: "Read the Room", icon: MessagesSquare },
    { id: "reframe", to: "/reframe", label: "Reframe Lab", icon: Shuffle },
  ] as const;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="nb-dots flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <img
              src={logo}
              alt="ShiftedTone"
              width={34}
              height={34}
              className="nb size-8 bg-ink transition-transform duration-200 group-hover:-rotate-6"
            />
            <span className="font-display text-lg leading-none">
              Shifted<span className="text-sun">Tone</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`nb nb-press flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors sm:px-3 ${
                    isActive ? "bg-sun text-ink" : "bg-transparent text-paper/75 hover:text-paper"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard#progress"
              className="flex items-center gap-2"
              title={`Level ${level.level} — ${level.label}`}
            >
              <LevelRing level={level.level} pct={level.progressPct} />
              <span className="hidden flex-col leading-tight lg:flex">
                <span className="text-[10px] font-bold uppercase tracking-widest text-paper/60">
                  Level {level.level}
                </span>
                <span className="font-display text-xs">{level.label}</span>
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="nb nb-press flex items-center gap-2 bg-coral px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t-2 border-ink bg-ink py-4 text-center text-[10px] font-bold uppercase tracking-widest text-paper/50">
        ShiftedTone — train the tone that says it
      </footer>
    </div>
  );
}

/** Small round XP progress ring with the level number inside. */
export function LevelRing({ level, pct }: { level: number; pct: number }) {
  const R = 15.5;
  const C = 2 * Math.PI * R;
  return (
    <span className="relative inline-flex size-9 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={R} fill="none" strokeWidth="3" className="stroke-paper/20" />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          strokeWidth="3"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          strokeLinecap="butt"
          className="stroke-sun"
        />
      </svg>
      <span className="font-display text-[11px] font-bold tabular-nums">{level}</span>
    </span>
  );
}
