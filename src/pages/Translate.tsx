import { AppShell } from "@/components/AppShell";
import { NBBadge, NBButton, NBPanel, NBStat } from "@/components/nb";
import { MicError } from "@/components/MicError";
import { MicPicker } from "@/components/MicPicker";
import { getSavedMicDeviceId } from "@/lib/mic-prefs";
import { ResponsePlanner } from "@/components/ResponsePlanner";
import { useToneCapture } from "@/hooks/use-tone-capture";
import { api } from "@/convex/_generated/api";
import {
  passOrder,
  TRANSLATION_LINES,
  type TranslationLine,
} from "@/lib/translation";
import {
  biggestLever,
  TONE_FACTORS,
  TONE_LABELS,
  type ToneAnalysis,
} from "@/lib/tone-analyzer";
import { ArrowRight, AudioLines, Languages, RefreshCw } from "lucide-react";
import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Pass = "reflex" | "intended";

/**
 * The Translation Drill — the app's core reprogramming loop. One real
 * sentence, said twice: once the way it usually comes out, once the way
 * you mean it. Same words both times, so the score delta isolates
 * delivery — it's the only variable.
 */
export default function Translate() {
  const capture = useToneCapture();
  const mark = useMutation(api.dailyLog.mark);

  const [line, setLine] = useState<TranslationLine>(() => {
    const d = new Date();
    return TRANSLATION_LINES[(d.getDate() + d.getMonth() * 31) % TRANSLATION_LINES.length];
  });
  const order = useMemo(() => passOrder(line.id.length + new Date().getDate()), [line.id]);
  const [reflexAnalysis, setReflexAnalysis] = useState<ToneAnalysis | null>(null);
  const [intendedAnalysis, setIntendedAnalysis] = useState<ToneAnalysis | null>(null);
  const [pass, setPass] = useState<Pass>(order[0]);
  /** The pass waiting on the hook's async analysis to land. */
  const [awaiting, setAwaiting] = useState<Pass | null>(null);
  const [lastSeen, setLastSeen] = useState<ToneAnalysis | null>(null);
  // Listen-back snapshots: the capture hook clears its blob on reset, so
  // each pass's audio is banked here the moment its analysis lands.
  const [reflexAudio, setReflexAudio] = useState<Blob | null>(null);
  const [intendedAudio, setIntendedAudio] = useState<Blob | null>(null);
  const done = reflexAnalysis !== null && intendedAnalysis !== null;

  // One object URL per banked take, reclaimed on change/unmount.
  const reflexUrl = useMemo(
    () => (reflexAudio ? URL.createObjectURL(reflexAudio) : null),
    [reflexAudio],
  );
  const intendedUrl = useMemo(
    () => (intendedAudio ? URL.createObjectURL(intendedAudio) : null),
    [intendedAudio],
  );
  useEffect(() => {
    return () => {
      if (reflexUrl) URL.revokeObjectURL(reflexUrl);
    };
  }, [reflexUrl]);
  useEffect(() => {
    return () => {
      if (intendedUrl) URL.revokeObjectURL(intendedUrl);
    };
  }, [intendedUrl]);

  const startPass = () => {
    // A failed attempt (denied mic, dead take) must not strand the flow on
    // the wrong pass — reset first, and clear any stale banking request.
    // The peak level of the last live take seeds the adaptive input gain,
    // so a quiet mic's next pass starts pre-calibrated.
    const seed = capture.lastPeakRawRms;
    capture.reset();
    setAwaiting(null);
    capture.start(seed, getSavedMicDeviceId());
  };

  const finishPass = () => {
    // stop() is void — the analysis arrives in hook state a beat later,
    // and the render-adjust below banks it the moment it differs. A failed
    // stop (dead mic) re-enters idle *without* an analysis, which the same
    // render-adjust treats as the all-clear below.
    capture.stop();
    setAwaiting(pass);
  };

  // Bank each pass's analysis during render as the hook produces it
  // (React's "adjust state when a prop changes" pattern — no effect).
  // A failed stop (dead mic / denied permission) returns to idle with no
  // analysis — clear the wait so the button comes back and the pass can be
  // retried, with the hook's specific error shown below.
  if (awaiting && capture.state === "idle" && !capture.analysis) {
    setAwaiting(null);
  } else if (awaiting && capture.analysis && capture.analysis !== lastSeen) {
    const banked = capture.analysis;
    setLastSeen(banked);
    if (awaiting === "reflex") {
      setReflexAnalysis(banked);
      setReflexAudio(capture.audioBlob);
      setPass(order[1]);
    } else {
      setIntendedAnalysis(banked);
      setIntendedAudio(capture.audioBlob);
    }
    setAwaiting(null);
  }

  // A completed translation credits the daily checklist (idempotent server-side).
  useEffect(() => {
    if (reflexAnalysis && intendedAnalysis) {
      mark({ action: "translate" }).catch(() => {});
    }
  }, [reflexAnalysis, intendedAnalysis, mark]);

  const restart = () => {
    capture.reset();
    setReflexAnalysis(null);
    setIntendedAnalysis(null);
    setReflexAudio(null);
    setIntendedAudio(null);
    setPass(order[0]);
    setAwaiting(null);
  };

  const nextLine = () => {
    const idx = TRANSLATION_LINES.indexOf(line);
    setLine(TRANSLATION_LINES[(idx + 1) % TRANSLATION_LINES.length]);
    restart();
  };

  const delta =
    reflexAnalysis && intendedAnalysis
      ? {
          calm: intendedAnalysis.calmScore - reflexAnalysis.calmScore,
          energy: intendedAnalysis.energyScore - reflexAnalysis.energyScore,
          clarity: intendedAnalysis.clarityScore - reflexAnalysis.clarityScore,
          stability: intendedAnalysis.stabilityScore - reflexAnalysis.stabilityScore,
        }
      : null;

  const passNum = pass === order[0] ? 1 : 2;

  return (
    <AppShell active="translate">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        {/* Header */}
        <div>
          <NBBadge className="bg-sun text-ink">
            <Languages className="size-3" /> The Translation Drill
          </NBBadge>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">
            Say it again. This time, mean it.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Same words, two takes. First the way it usually comes out under
            pressure — then the way you actually intend it. The score delta is
            pure delivery: it's the only variable.
          </p>
        </div>

        {/* The line */}
        <NBPanel className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {done ? "Translated" : "The sentence"}
            </span>
            <button
              onClick={nextLine}
              className="nb nb-press flex items-center gap-1.5 bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <RefreshCw className="size-3" /> Different sentence
            </button>
          </div>
          <p className="mt-3 font-display text-2xl leading-snug">“{line.text}”</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="nb bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-coral">
                How it usually comes out
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{line.usually}</p>
            </div>
            <div className="nb bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mint">
                What you're aiming for
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{line.intended}</p>
            </div>
          </div>
        </NBPanel>

        {/* The think-through: what is take two actually for? Visible
            before and between the passes — never after, when the teachable
            moment has already passed. */}
        {!done && (
          <ResponsePlanner
            title={reflexAnalysis ? "Before the intended take — think it through" : "Before you speak — think it through"}
            intro="Four questions, sixty seconds. The difference between reacting and responding is almost never the words — it's what you decided underneath them."
            accent="bg-card"
          />
        )}

        {/* Take flow */}
        {!done && (
          <NBPanel className="p-6">
            {/* Step tracker — two passes in the actual run order, always
                visible so you know where you are and what's left */}
            <div className="flex items-stretch gap-2" aria-hidden>
              {order.map((passKey, i) => {
                const label = passKey === "reflex" ? "Reflex take" : "Intended take";
                const isCurrent = pass === passKey;
                const isDone =
                  (passKey === "reflex" ? reflexAnalysis : intendedAnalysis) !== null;
                return (
                  <div
                    key={passKey}
                    className={cn(
                      "flex-1 border-2 border-ink px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest",
                      isDone
                        ? "bg-mint"
                        : isCurrent
                          ? "bg-sun"
                          : "bg-card text-muted-foreground",
                    )}
                  >
                    {isDone ? "✓ " : ""}
                    {i + 1} · {label}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <NBBadge className={pass === "reflex" ? "bg-coral text-ink" : "bg-mint text-ink"}>
                Pass {passNum} of 2 —{" "}
                {pass === "reflex" ? "as it usually comes out" : "as you mean it"}
              </NBBadge>
              <span className="text-xs text-muted-foreground">{line.targetHint}</span>
            </div>

            {capture.state === "idle" && (
              <div className="mt-5 flex justify-center">
                <NBButton onClick={startPass} variant={pass === "reflex" ? "coral" : "mint"}>
                  Say it — {pass === "reflex" ? "reflex take" : "intended take"}
                </NBButton>
              </div>
            )}
            {capture.state === "recording" && (
              <div className="mt-5 flex flex-col items-center gap-3">
                <div className="font-display text-4xl tabular-nums">
                  {Math.floor(capture.elapsedMs / 1000)}s
                </div>
                <NBButton onClick={finishPass} variant="ink">
                  Done — score this take
                </NBButton>
              </div>
            )}
            {capture.state === "analyzing" && (
              <div className="mt-5 text-center font-display">Analyzing…</div>
            )}
            {capture.error && <MicError message={capture.error} />}
            {capture.state === "recording" && capture.micMuted && (
              <p className="nb mt-5 bg-sun px-3 py-2 text-sm font-medium">
                The mic reports itself muted — check your system's mic privacy
                setting or close the app holding it; this take will come back
                empty otherwise.
              </p>
            )}
            <MicPicker activeLabel={capture.activeDeviceLabel} className="mt-5" />

            {/* Hear pass one before recording pass two — hearing the pattern
                is what makes the intended take a deliberate change. */}
            {reflexAnalysis && !done && (
              <div className="mt-5 nb bg-card p-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <AudioLines className="size-4" /> Hear your reflex take
                </div>
                {reflexUrl ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption -- voice takes have no captions */}
                    <audio
                      controls
                      src={reflexUrl}
                      className="nb mt-2 w-full bg-card"
                      aria-label="Your reflex take"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Listen once, then change it: the intended take is the
                      same words, delivered the way you mean them.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This take couldn't be recorded for replay — the scores
                    still stand.
                  </p>
                )}
              </div>
            )}
          </NBPanel>
        )}

        {/* Compare */}
        {done && delta && (
          <NBPanel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <NBBadge className="bg-sun text-ink">The translation</NBBadge>
              <span className="text-xs text-muted-foreground">{line.payoff}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <NBStat label="Calm Δ" value={fmtDelta(delta.calm)} />
              <NBStat label="Energy Δ" value={fmtDelta(delta.energy)} />
              <NBStat label="Clarity Δ" value={fmtDelta(delta.clarity)} />
              <NBStat label="Stability Δ" value={fmtDelta(delta.stability)} />
            </div>

            <p className="mt-4 text-sm leading-relaxed">
              <span className="font-bold">What the gap means: </span>
              <span className="text-muted-foreground">{describeDelta(delta)}</span>
            </p>

            <details className="mt-4 nb bg-secondary p-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest">
                How each take is rated
              </summary>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {Object.entries(TONE_FACTORS).map(([key, factor]) => (
                  <li key={key}>
                    <span className="font-bold">{factor.label}: </span>
                    <span className="text-muted-foreground">{factor.how}</span>
                  </li>
                ))}
              </ul>
            </details>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="nb bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-coral">
                  Reflex take
                </p>
                <p className="mt-1 font-display text-lg">
                  {TONE_LABELS[reflexAnalysis!.dominantTone]?.label ??
                    reflexAnalysis!.dominantTone}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {TONE_LABELS[reflexAnalysis!.dominantTone]?.note}
                </p>
                <p className="mt-3 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
                  <span className="font-bold">
                    Rated {reflexAnalysis!.overallScore}/100 —{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {biggestLever(reflexAnalysis!).tip}
                  </span>
                </p>
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <AudioLines className="size-3.5" /> Hear this take
                  </div>
                  {reflexUrl ? (
                    /* eslint-disable-next-line jsx-a11y/media-has-caption -- voice takes have no captions */
                    <audio
                      controls
                      src={reflexUrl}
                      className="nb mt-1.5 w-full bg-card"
                      aria-label="Your reflex take"
                    />
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      No replay for this one — the browser couldn't capture
                      audio. The score still stands.
                    </p>
                  )}
                </div>
              </div>
              <div className="nb bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mint">
                  Intended take
                </p>
                <p className="mt-1 font-display text-lg">
                  {TONE_LABELS[intendedAnalysis!.dominantTone]?.label ??
                    intendedAnalysis!.dominantTone}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {TONE_LABELS[intendedAnalysis!.dominantTone]?.note}
                </p>
                <p className="mt-3 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
                  <span className="font-bold">
                    Rated {intendedAnalysis!.overallScore}/100 —{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {biggestLever(intendedAnalysis!).tip}
                  </span>
                </p>
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <AudioLines className="size-3.5" /> Hear this take
                  </div>
                  {intendedUrl ? (
                    /* eslint-disable-next-line jsx-a11y/media-has-caption -- voice takes have no captions */
                    <audio
                      controls
                      src={intendedUrl}
                      className="nb mt-1.5 w-full bg-card"
                      aria-label="Your intended take"
                    />
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      No replay for this one — the browser couldn't capture
                      audio. The score still stands.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <NBButton onClick={restart} variant="paper">
                Redo this sentence
              </NBButton>
              <NBButton onClick={nextLine} variant="sun">
                Next sentence <ArrowRight className="size-4" />
              </NBButton>
            </div>
          </NBPanel>
        )}
      </div>
    </AppShell>
  );
}

function fmtDelta(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

type PassDelta = {
  calm: number;
  energy: number;
  clarity: number;
  stability: number;
};

/**
 * The delta grid shows the numbers; this says what they mean in one
 * sentence, so the reader walks away understanding their own progress
 * instead of decoding four signed integers.
 */
function describeDelta(delta: PassDelta): string {
  const ups: string[] = [];
  const downs: string[] = [];
  (
    [
      ["calm", delta.calm],
      ["energy", delta.energy],
      ["clarity", delta.clarity],
      ["stability", delta.stability],
    ] as const
  ).forEach(([name, d]) => {
    if (d > 0) ups.push(name);
    if (d < 0) downs.push(name);
  });
  if (ups.length === 0 && downs.length === 0) {
    return "Dead even — the two takes scored identically. Run the sentence again and lean harder into the intended delivery so the gap shows up.";
  }
  if (downs.length === 0) {
    return `Every factor held or moved up (${ups.join(", ")}) — the intended delivery genuinely landed. Same words, steadier voice.`;
  }
  if (ups.length === 0) {
    return `The \u201cmeant\u201d version came out ${downs.join(" and ")} lower — the reflex take outscored it. Try the intended one again: slower, on the exhale.`;
  }
  return `The intended take lifted ${ups.join(", ")} but slipped on ${downs.join(
    " and ",
  )} — mixed delivery. One more pass usually settles it.`;
}
