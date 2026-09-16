import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import {
  GROUNDING_EXERCISES,
  groundingRoundMs,
  groundingStateAt,
  groundingTotalMs,
  orbScaleForStep,
  type GroundingExercise,
} from "@/lib/grounding";
import {
  Eye,
  RotateCcw,
  ScanLine,
  Square,
  Timer,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

const ICONS = {
  wind: Wind,
  box: Square,
  waves: Waves,
  eye: Eye,
  scan: ScanLine,
  timer: Timer,
} as const;

/** "80s" / "1m 40s" — session length at a glance. */
function fmtTotal(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * The grounding kit — every calm-down exercise in one compact panel.
 * Six exercises (breath pacers + attention guides), one shared orb
 * runner. Replaces the old single-pacer Reset; completing any exercise's
 * suggested rounds still credits the daily checklist's reset.
 */
export function GroundingKit() {
  const markReset = useMutation(api.dailyLog.mark);
  const [activeId, setActiveId] = useState(GROUNDING_EXERCISES[0].id);
  const ex =
    GROUNDING_EXERCISES.find((e) => e.id === activeId) ?? GROUNDING_EXERCISES[0];
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const raf = useRef<number | null>(null);
  const startTs = useRef<number>(0);
  const totalMs = groundingTotalMs(ex);

  useEffect(() => {
    if (!running) return;
    const tick = (now: number) => {
      const t = now - startTs.current;
      setElapsed(t);
      if (t >= totalMs) {
        setRunning(false);
        setFinished(true);
        // Suggested rounds completed — credit today's checklist (idempotent server-side).
        markReset({ action: "reset" }).catch(() => {});
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    startTs.current = performance.now();
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [running, totalMs, markReset]);

  const stop = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setFinished(false);
  };
  const switchTo = (id: string) => {
    setActiveId(id);
    setRunning(false);
    setElapsed(0);
    setFinished(false);
  };

  const s = groundingStateAt(ex, elapsed);
  const scale = running ? orbScaleForStep(s.step.kind, s.progress) : 0.72;
  const secondsLeft = running ? Math.ceil(s.msLeftInStep / 1000) : null;
  const overall = Math.min(1, elapsed / totalMs);

  return (
    <NBPanel className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-5 py-3">
        <div className="flex items-center gap-2 font-display text-xl">
          <Wind className="size-5" /> Grounding kit
        </div>
        {running && (
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="size-2 bg-coral nb"
            />
            Round {s.round} of {ex.rounds}
          </span>
        )}
      </div>

      {/* Exercise tabs */}
      <div className="flex gap-1 overflow-x-auto border-b-2 border-ink bg-secondary/60 p-2">
        {GROUNDING_EXERCISES.map((e) => {
          const Icon = ICONS[e.icon];
          const active = e.id === ex.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => switchTo(e.id)}
              aria-pressed={active}
              className={cn(
                "nb flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                active ? "bg-ink text-paper" : "bg-card hover:bg-muted",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">{e.name}</span>
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {!running && !finished && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <NBBadge className={cn("text-ink", ex.color)}>{ex.tag}</NBBadge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {ex.rounds} rounds · {fmtTotal(totalMs)}
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {ex.intro}
            </p>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="nb flex size-20 items-center justify-center bg-mint"
            >
              <span className="font-display text-base">
                {groundingRoundMs(ex) % 10_000 === 0 && ex.id === "box-breathing"
                  ? "4·4·4·4"
                  : ex.id === "reset-478"
                    ? "4·7·8"
                    : `${ex.steps.length} steps`}
              </span>
            </motion.div>
            <NBButton variant="coral" onClick={() => setRunning(true)} className="px-6 py-3 text-base">
              Begin {ex.name.toLowerCase()}
            </NBButton>
          </div>
        )}

        {running && (
          <div className="flex flex-col items-center gap-4">
            {/* The orb with progress ring */}
            <div className="relative flex size-56 items-center justify-center sm:size-64">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" strokeWidth="3" className="stroke-ink/15" />
                <circle
                  cx="50" cy="50" r="46" fill="none" strokeWidth="3"
                  className="stroke-coral transition-[stroke-dashoffset] duration-200"
                  strokeLinecap="butt"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - overall)}
                />
              </svg>
              <div
                aria-hidden
                className="nb absolute h-[62%] w-[62%] bg-sun"
                style={{ transform: "translate(6px, 6px) rotate(3deg)" }}
              />
              <motion.div
                animate={{ scale }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="nb flex size-[58%] items-center justify-center bg-mint"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${s.round}-${s.stepIndex}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="px-4 text-center"
                  >
                    <div className="font-display text-xl leading-tight sm:text-2xl">
                      {s.step.label}
                    </div>
                    {secondsLeft != null && (
                      <div className="mt-1 text-4xl font-bold tabular-nums">{secondsLeft}</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Live cue */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`${s.stepIndex}-${s.step.label}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-10 max-w-sm text-center text-sm italic text-muted-foreground"
              >
                {s.step.cue}
              </motion.p>
            </AnimatePresence>

            <div className="flex gap-3">
              <NBButton variant="paper" onClick={stop} className="text-xs">
                <X className="size-3.5" /> Stop early
              </NBButton>
              <NBButton variant="paper" onClick={reset} className="text-xs">
                <RotateCcw className="size-3.5" /> Restart
              </NBButton>
            </div>
          </div>
        )}

        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="nb flex size-20 items-center justify-center bg-mint font-display text-xl">
              Done
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {ex.rounds} rounds of {ex.name.toLowerCase()}. That's your body
              told the threat passed — now speak slower than feels necessary.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <NBButton variant="coral" onClick={reset} className="text-sm">
                <RotateCcw className="size-4" /> Again
              </NBButton>
              <NBButton
                variant="ink"
                onClick={() => {
                  reset();
                  setRunning(true);
                }}
                className="text-sm"
              >
                Keep going
              </NBButton>
            </div>
          </motion.div>
        )}
      </div>
    </NBPanel>
  );
}

/** Exported for tests/story reuse if needed. */
export type { GroundingExercise };
