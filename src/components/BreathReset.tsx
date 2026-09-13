import { NBButton, NBPanel } from "@/components/nb";
import {
  BREATH_CUES,
  BREATH_LABELS,
  BREATH_TOTAL_MS,
  breathStateAt,
  orbScaleFor,
} from "@/lib/breath";
import { RotateCcw, Wind, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SUGGESTED_ROUNDS = 3;

/**
 * The big reset: a full-panel, breath-paced orb with ring progress,
 * live cues, and round counting. Much larger and more interactive than
 * the old mini-pacer — this is a place you go, not a widget you glance at.
 */
export function BreathReset() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const raf = useRef<number | null>(null);
  const startTs = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const tick = (now: number) => {
      const t = now - startTs.current;
      setElapsed(t);
      if (t >= BREATH_TOTAL_MS * SUGGESTED_ROUNDS) {
        setRunning(false);
        setFinished(true);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    startTs.current = performance.now();
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [running]);

  const stop = () => {
    setRunning(false);
  };
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setFinished(false);
  };

  const s = breathStateAt(elapsed);
  const scale = running ? orbScaleFor(s.phase, s.progress) : 0.72;
  const secondsLeft = running ? Math.ceil(s.msLeftInPhase / 1000) : null;
  const overall = Math.min(1, elapsed / (BREATH_TOTAL_MS * SUGGESTED_ROUNDS));

  return (
    <NBPanel className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-5 py-3">
        <div className="flex items-center gap-2 font-display text-xl">
          <Wind className="size-5" /> The Reset
        </div>
        {running && (
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="size-2 bg-coral nb"
            />
            Round {s.round} of {SUGGESTED_ROUNDS}
          </span>
        )}
      </div>

      <div className="p-6">
        {!running && !finished && (
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Four in. Seven held. Eight out. Two or three rounds drop your
              shoulders — and your pitch follows your shoulders. Full screen
              when you want the room to disappear.
            </p>
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="nb flex size-24 items-center justify-center bg-mint"
            >
              <span className="font-display text-lg">4·7·8</span>
            </motion.div>
            <NBButton variant="coral" onClick={() => setRunning(true)} className="px-6 py-3 text-base">
              Begin the reset
            </NBButton>
          </div>
        )}

        {running && (
          <div className="flex flex-col items-center gap-6">
            {/* The orb with progress ring */}
            <div className="relative flex size-64 items-center justify-center sm:size-72">
              {/* Track ring */}
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
              {/* Sun backing block for depth */}
              <div
                aria-hidden
                className="nb absolute h-[62%] w-[62%] rotate-3 bg-sun"
                style={{ transform: `translate(6px, 6px) rotate(3deg)` }}
              />
              {/* The breathing orb */}
              <motion.div
                animate={{ scale }}
                transition={{ duration: running ? 0.35 : 0.4, ease: "easeInOut" }}
                className="nb flex size-[58%] items-center justify-center bg-mint"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={s.phase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-center"
                  >
                    <div className="font-display text-2xl">{BREATH_LABELS[s.phase]}</div>
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
                key={s.phase}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-5 text-center text-sm italic text-muted-foreground"
              >
                {BREATH_CUES[s.phase]}
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
              Three rounds. That's your nervous system told the threat passed.
              Now say the thing — slower than feels necessary.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <NBButton variant="coral" onClick={reset} className="text-sm">
                <RotateCcw className="size-4" /> Another round
              </NBButton>
              <NBButton variant="ink" onClick={() => setRunning(true)} className="text-sm">
                Keep going (3 more)
              </NBButton>
            </div>
          </motion.div>
        )}
      </div>
    </NBPanel>
  );
}
