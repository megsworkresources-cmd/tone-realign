import { NBBadge, NBButton, NBPanel, NBMeter } from "@/components/nb";
import { CoachNote } from "@/components/CoachNote";
import { getDrill, type Drill } from "@/lib/drills";
import { getDailyChallenge } from "@/lib/daily";
import { TONE_LABELS, type ToneAnalysis } from "@/lib/tone-analyzer";
import { useToneCapture } from "@/hooks/use-tone-capture";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Check, Mic, Square } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Practice() {
  const { drillId } = useParams();
  const drill = drillId ? getDrill(drillId) : undefined;

  if (!drill) {
    return (
      <main className="nb-dots min-h-screen bg-paper px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <NBPanel className="p-8 text-center">
            <p className="font-display text-xl">We couldn't find that drill</p>
            <Link to="/dashboard" className="mt-4 inline-block">
              <NBButton variant="paper">Back to dashboard</NBButton>
            </Link>
          </NBPanel>
        </div>
      </main>
    );
  }

  // Keyed by drillId: switching drills remounts the runner, which resets
  // capture and saved state cleanly instead of via setState-in-effect.
  return <PracticeRunner key={drillId} drill={drill} />;
}

function PracticeRunner({ drill }: { drill: Drill }) {
  const capture = useToneCapture();
  const [saved, setSaved] = useState(false);
  const drillStats = useQuery(api.sessions.drillStats);
  const bestByDrill = new Map((drillStats ?? []).map((s) => [s.drill, s]));

  const { state, error, level, livePitchHz, elapsedMs, analysis, transcript, start, stop, reset } =
    capture;

  return (
    <main className="nb-dots min-h-screen bg-paper px-4 pb-16 pt-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to="/dashboard">
            <NBButton variant="paper" className="px-3 py-2">
              <ArrowLeft className="size-4" /> Dashboard
            </NBButton>
          </Link>
          <div className="flex items-center gap-2">
            {getDailyChallenge().drill.id === drill.id && (
              <NBBadge className="bg-coral">★ Today's challenge</NBBadge>
            )}
            <NBBadge className="bg-sun">{drill.tag}</NBBadge>
          </div>
        </div>

        {/* Drill header */}
        <NBPanel className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl">{drill.name}</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {drill.focus}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="size-5" />
              <span className="font-display text-lg">{fmtTime(elapsedMs)}</span>
              <span className="text-xs font-bold text-muted-foreground">
                / {fmtTime(drill.seconds * 1000)}
              </span>
            </div>
          </div>
          <div className="mt-4 nb bg-secondary p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Your prompt
            </p>
            <p className="mt-1 font-medium leading-relaxed">{drill.prompt}</p>
          </div>
        </NBPanel>

        {/* Recorder */}
        <NBPanel className="p-6">
          <div className="flex flex-col items-center gap-5">
            {/* Live visualizer */}
            <div
              className="flex h-24 w-full items-end justify-center gap-1"
              aria-hidden
            >
              {Array.from({ length: 28 }).map((_, i) => {
                const wave =
                  state === "recording"
                    ? Math.max(
                        level *
                          (0.4 +
                            0.6 *
                              Math.abs(
                                Math.sin(i * 0.9 + elapsedMs / 180),
                              )),
                        0.06,
                      )
                    : 0.06;
                const heightPct = Math.min(wave * 100, 100);
                return (
                  <div
                    key={i}
                    className={
                      i >= 8 && i <= 19 ? "w-2.5 bg-coral" : "w-2.5 bg-ink/70"
                    }
                    style={{ height: `${Math.max(heightPct, 6)}%` }}
                  />
                );
              })}
            </div>

            {state === "recording" && (
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Live pitch · {livePitchHz ? `${Math.round(livePitchHz)} Hz` : "listening for you…"}
                {level < 0.06 && elapsedMs > 3000 && " · we can barely hear you — move closer"}
              </p>
            )}

            {error && (
              <p className="nb bg-coral px-3 py-2 text-sm font-medium">{error}</p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              {state === "idle" && (
                <NBButton onClick={start} variant="coral">
                  <Mic className="size-4" /> Start my take
                </NBButton>
              )}
              {state === "recording" && (
                <NBButton onClick={stop} variant="ink">
                  <Square className="size-4" /> Done — score it
                </NBButton>
              )}
              {state === "analyzing" && (
                <NBButton disabled variant="ink">
                  Analyzing…
                </NBButton>
              )}
              {state === "done" && (
          <NBButton onClick={reset} variant="paper">
            Go again
          </NBButton>
              )}
            </div>
          </div>
        </NBPanel>

        {/* Results */}
        {state === "done" && analysis && (
          <NBPanel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <NBBadge
                  className={
                    TONE_LABELS[analysis.dominantTone]?.color ?? "bg-secondary"
                  }
                >
                  {TONE_LABELS[analysis.dominantTone]?.label ??
                    analysis.dominantTone}
                </NBBadge>
                <p className="max-w-md text-sm text-muted-foreground">
                  {TONE_LABELS[analysis.dominantTone]?.note}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Overall
                </div>
                <div className="font-display text-5xl">
                  {analysis.overallScore}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Calm", analysis.calmScore],
                  ["Energy", analysis.energyScore],
                  ["Clarity", analysis.clarityScore],
                  ["Stability", analysis.stabilityScore],
                ] as const
              ).map(([label, score]) => (
                <div key={label} className="nb bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {label}
                    </span>
                    <span className="font-display text-xl">{score}</span>
                  </div>
                  <NBMeter value={score} className="mt-2" />
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="nb bg-secondary p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Pitch
                </div>
                <div className="font-display text-lg">{analysis.avgPitchHz} Hz</div>
              </div>
              <div className="nb bg-secondary p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Range
                </div>
                <div className="font-display text-lg">{analysis.pitchRangeHz} Hz</div>
              </div>
              <div className="nb bg-secondary p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Pace
                </div>
                <div className="font-display text-lg">{analysis.wordsPerMinute} wpm</div>
              </div>
              <div className="nb bg-secondary p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Voiced
                </div>
                <div className="font-display text-lg">
                  {Math.round(analysis.voicedRatio * 100)}%
                </div>
              </div>
            </div>

            <SaveRow
              analysis={analysis}
              drillId={drill.id}
              elapsedMs={elapsedMs}
              transcript={transcript}
              saved={saved}
              onSaved={() => setSaved(true)}
              onRetry={reset}
              drillStats={bestByDrill.get(drill.id)}
            />
          </NBPanel>
        )}

        {/* Tips */}
        <NBPanel className="bg-secondary p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Before you start
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {drill.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="nb flex size-5 shrink-0 items-center justify-center bg-sun text-[10px] font-bold">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </NBPanel>
      </div>
    </main>
  );
}

function SaveRow({
  analysis,
  drillId,
  elapsedMs,
  transcript,
  saved,
  onSaved,
  onRetry,
  drillStats,
}: {
  analysis: ToneAnalysis;
  drillId: string;
  elapsedMs: number;
  transcript: string;
  saved: boolean;
  onSaved: () => void;
  onRetry: () => void;
  drillStats?: { bestScore: number; attemptCount: number };
}) {
  const saveSession = useMutation(api.sessions.saveSession);
  const markTake = useMutation(api.dailyLog.mark);
  const addBonus = useMutation(api.dailyLog.addBonus);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<Id<"practiceSessions"> | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Credit the daily checklist + a personal-best bonus when earned.
      try {
        await markTake({ action: "take" });
      } catch { /* checklist credit is best-effort */ }
      if (analysis.overallScore >= (drillStats?.bestScore ?? 0)) {
        addBonus({ amount: 25 }).catch(() => {});
      }
      const sessionId = await saveSession({
        drill: drillId,
        durationMs: Math.round(elapsedMs),
        calmScore: analysis.calmScore,
        energyScore: analysis.energyScore,
        clarityScore: analysis.clarityScore,
        stabilityScore: analysis.stabilityScore,
        overallScore: analysis.overallScore,
        avgPitchHz: analysis.avgPitchHz,
        pitchRangeHz: analysis.pitchRangeHz,
        avgVolume: analysis.avgVolume,
        volumeVariability: analysis.volumeVariability,
        wordsPerMinute: analysis.wordsPerMinute,
        voicedRatio: analysis.voicedRatio,
        dominantTone: analysis.dominantTone,
        transcript: transcript || undefined,
      });
      setSavedId(sessionId);
      toast.success("Saved. It's in your log.");
      onSaved();
    } catch {
      toast.error("Couldn't save that one. Give it another go.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!saved ? (
          <NBButton onClick={handleSave} disabled={saving} variant="mint">
            {saving ? "Saving…" : "Add to my log"}
          </NBButton>
        ) : (
          <span className="nb inline-flex items-center gap-1 bg-mint px-3 py-2 text-sm font-bold">
            <Check className="size-4" /> Saved
          </span>
        )}
        <NBButton onClick={onRetry} variant="paper">
          Not my best — again
        </NBButton>
      </div>
      {savedId && <CoachNote sessionId={savedId} />}
    </>
  );
}
