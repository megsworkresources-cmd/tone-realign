import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A bordered flat panel with hard shadow — the core neobrutalism block. */
export function NBPanel({
  children,
  className,
  shadow = true,
}: {
  children: ReactNode;
  className?: string;
  shadow?: boolean;
}) {
  return (
    <div
      className={cn(
        "nb bg-card",
        shadow && "nb-shadow",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A chunky bordered button with press physics. */
export function NBButton({
  children,
  className,
  variant = "sun",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "sun" | "mint" | "coral" | "paper" | "ink";
}) {
  const variants: Record<string, string> = {
    sun: "bg-sun text-ink",
    mint: "bg-mint text-ink",
    coral: "bg-coral text-ink",
    paper: "bg-card text-ink",
    ink: "bg-ink text-paper",
  };
  return (
    <button
      className={cn(
        "nb nb-press nb-shadow-sm inline-flex items-center justify-center gap-2 px-5 py-2.5 font-display text-sm uppercase tracking-wide",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Small square-cornered label chip. */
export function NBBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "nb inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Big flat stat block. */
export function NBStat({
  label,
  value,
  suffix,
  className,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  className?: string;
}) {
  return (
    <NBPanel className={cn("p-4", className)}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-3xl leading-none">{value}</span>
        {suffix && <span className="text-sm font-bold">{suffix}</span>}
      </div>
    </NBPanel>
  );
}

/** Horizontal meter with segmented flat blocks. */
export function NBMeter({
  value,
  className,
  barClassName = "bg-sun",
}: {
  value: number; // 0..100
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const segments = 20;
  const filled = Math.round((clamped / 100) * segments);
  return (
    <div className={cn("flex h-3 gap-[3px]", className)} aria-hidden>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn("flex-1", i < filled ? barClassName : "bg-muted")}
        />
      ))}
    </div>
  );
}
