import { AppShell } from "@/components/AppShell";
import { NBBadge, NBButton, NBPanel, NBStat } from "@/components/nb";
import { MicError } from "@/components/MicError";
import { MicPicker } from "@/components/MicPicker";
import { getSavedMicDeviceId } from "@/lib/mic-prefs";
import { ResponsePlanner } from "@/components/ResponsePlanner";
import { useToneCapture } from "@/hooks/use-tone-capture";
import { passOrder, TRANSLATION_LINES, type TranslationLine } from "@/lib/translation";
import { biggestLever, TONE_LABELS, type ToneAnalysis } from "@/lib/tone-analyzer";
import { ArrowRight, AudioLines, Languages, RefreshCw } from "lucide-react";
import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

type Pass = "reflex" | "intended";

export default function Translate() {
  const capture = useToneCapture();
  const mark = useMutation(api.dailyLog.mark);
  const [line, setLine] = useState<TranslationLine>(() => {
    const d = new Date();
    return TRANSLATION_LINES[(d.getDate() + d.getMonth() * 31) % TRANSLATION_LINES.length];
  });
  const order = useMemo(() => passOrder(line.id.length + new Date().getDate()), [line.id]);
  const [pass, setPass] = useState<Pass>(order[0]);
  const [pendingPass, setPendingPass] = useState<Pass | null>(null);
  const [lastSeen, setLastSeen] = useState<ToneAnalysis | null>(null);
  const [reflexAnalysis, setReflexAnalysis] = useState<ToneAnalysis | null>(null);
  const [intendedAnalysis, setIntendedAnalysis] = useState<ToneAnalysis | null>(null);
  const [reflexAudio, setReflexAudio] = useState<Blob | null>(null);
  const [intendedAudio, setIntendedAudio] = useState<Blob | null>(null);
  const [previewPass, setPreviewPass] = useState<Pass | null>(null);
  const done = !!reflexAnalysis && !!intendedAnalysis;

  const reflexUrl = useMemo(() => (reflexAudio ? URL.createObjectURL(reflexAudio) : null), [reflexAudio]);
  const intendedUrl = useMemo(() => (intendedAudio ? URL.createObjectURL(intendedAudio) : null), [intendedAudio]);
  useEffect(() => () => { if (reflexUrl) URL.revokeObjectURL(reflexUrl); }, [reflexUrl]);
  useEffect(() => () => { if (intendedUrl) URL.revokeObjectURL(intendedUrl); }, [intendedUrl]);

  useEffect(() => {
    if (!pendingPass || !capture.analysis || capture.analysis === lastSeen) return;
    const analysis = capture.analysis;
    setLastSeen(analysis);
    if (pendingPass === "reflex") {
      setReflexAnalysis(analysis);
      setReflexAudio(capture.audioBlob);
    } else {
      setIntendedAnalysis(analysis);
      setIntendedAudio(capture.audioBlob);
    }
    setPreviewPass(pendingPass);
    setPendingPass(null);
    setPass(order.find((candidate) => candidate !== pendingPass) ?? pendingPass);
  }, [capture.analysis, capture.audioBlob, lastSeen, order, pendingPass]);

  useEffect(() => {
    if (reflexAnalysis && intendedAnalysis) mark({ action: "translate" }).catch(() => {});
  }, [reflexAnalysis, intendedAnalysis, mark]);

  const startPass = () => {
    const seed = capture.lastPeakRawRms;
    capture.reset();
    setPendingPass(null);
    capture.start(seed, getSavedMicDeviceId());
  };

  const finishPass = () => {
    if (capture.state !== "recording") return;
    setPendingPass(pass);
    capture.stop();
  };

  const restart = () => {
    capture.reset();
    setReflexAnalysis(null);
    setIntendedAnalysis(null);
    setReflexAudio(null);
    setIntendedAudio(null);
    setPreviewPass(null);
    setPendingPass(null);
    setLastSeen(null);
    setPass(order[0]);
  };

  const nextLine = () => {
    const index = TRANSLATION_LINES.indexOf(line);
    setLine(TRANSLATION_LINES[(index + 1) % TRANSLATION_LINES.length]);
    restart();
  };

  const activePreview = previewPass === "reflex" ? reflexUrl : previewPass === "intended" ? intendedUrl : null;
  const activePreviewLabel = previewPass === "reflex" ? "Reflex take" : "Intended take";
  const delta = reflexAnalysis && intendedAnalysis ? {
    calm: intendedAnalysis.calmScore - reflexAnalysis.calmScore,
    energy: intendedAnalysis.energyScore - reflexAnalysis.energyScore,
    clarity: intendedAnalysis.clarityScore - reflexAnalysis.clarityScore,
    stability: intendedAnalysis.stabilityScore - reflexAnalysis.stabilityScore,
  } : null;

  return (
    <AppShell active="translate">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <div>
          <NBBadge className="bg-sun text-ink"><Languages className="size-3" /> The Translation Drill</NBBadge>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Say it again. This time, mean it.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Same words, two takes. First the way it usually comes out under pressure — then the way you actually intend it.</p>
        </div>

        <NBPanel className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{done ? "Translated" : "The sentence"}</span>
            <button type="button" onClick={nextLine} className="nb nb-press flex items-center gap-1.5 bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest"><RefreshCw className="size-3" /> Different sentence</button>
          </div>
          <p className="mt-3 font-display text-2xl leading-snug">“{line.text}”</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="nb bg-card p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-coral">How it usually comes out</p><p className="mt-1 text-sm text-muted-foreground">{line.usually}</p></div>
            <div className="nb bg-card p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-mint">What you're aiming for</p><p className="mt-1 text-sm text-muted-foreground">{line.intended}</p></div>
          </div>
        </NBPanel>

        {!done && <ResponsePlanner title={previewPass ? `Before the ${pass} take — think it through` : "Before you speak — think it through"} />}

        {!done && <NBPanel className="p-6">
          <div className="flex items-stretch gap-2">
            {order.map((passKey, i) => {
              const completed = passKey === "reflex" ? !!reflexAnalysis : !!intendedAnalysis;
              return <button key={passKey} type="button" disabled={!completed} onClick={() => completed && setPreviewPass(passKey)} className={cn("flex-1 border-2 border-ink px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest", completed ? "bg-mint nb-press" : pass === passKey ? "bg-sun" : "bg-card text-muted-foreground")} aria-pressed={previewPass === passKey}>{completed ? "✓ " : ""}{i + 1} · {passKey === "reflex" ? "Reflex take" : "Intended take"}</button>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><NBBadge className={pass === "reflex" ? "bg-coral text-ink" : "bg-mint text-ink"}>Pass {order.indexOf(pass) + 1} of 2 — {pass === "reflex" ? "as it usually comes out" : "as you mean it"}</NBBadge><span className="text-xs text-muted-foreground">{line.targetHint}</span></div>
          {capture.state === "idle" && <div className="mt-5 flex justify-center"><NBButton onClick={startPass} variant={pass === "reflex" ? "coral" : "mint"}>Say it — {pass} take</NBButton></div>}
          {capture.state === "recording" && <div className="mt-5 flex flex-col items-center gap-3"><div className="font-display text-4xl tabular-nums">{Math.floor(capture.elapsedMs / 1000)}s</div><NBButton onClick={finishPass} variant="ink">Done — score this take</NBButton></div>}
          {capture.state === "analyzing" && <div className="mt-5 text-center font-display">Analyzing…</div>}
          {capture.error && <MicError message={capture.error} />}
          {capture.state === "recording" && capture.micMuted && <p className="nb mt-5 bg-sun px-3 py-2 text-sm font-medium">The mic reports itself muted — check your system's mic privacy setting or close the app holding it.</p>}
          <MicPicker activeLabel={capture.activeDeviceLabel} className="mt-5" />
          {previewPass && <PlaybackPanel label={activePreviewLabel} url={activePreview} />}
        </NBPanel>}

        {done && delta && <NBPanel className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><NBBadge className="bg-sun text-ink">The translation</NBBadge><span className="text-xs text-muted-foreground">{line.payoff}</span></div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"><NBStat label="Calm Δ" value={fmtDelta(delta.calm)} /><NBStat label="Energy Δ" value={fmtDelta(delta.energy)} /><NBStat label="Clarity Δ" value={fmtDelta(delta.clarity)} /><NBStat label="Stability Δ" value={fmtDelta(delta.stability)} /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><ResultCard label="Reflex take" analysis={reflexAnalysis!} url={reflexUrl} /><ResultCard label="Intended take" analysis={intendedAnalysis!} url={intendedUrl} /></div>
          <div className="mt-5 flex flex-wrap justify-center gap-3"><NBButton onClick={restart} variant="paper">Redo this sentence</NBButton><NBButton onClick={nextLine} variant="sun">Next sentence <ArrowRight className="size-4" /></NBButton></div>
        </NBPanel>}
      </div>
    </AppShell>
  );
}

function PlaybackPanel({ label, url }: { label: string; url: string | null }) {
  return <div className="mt-5 nb bg-card p-3"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><AudioLines className="size-4" /> Hear your {label.toLowerCase()}</div>{url ? <audio controls preload="metadata" src={url} className="nb mt-2 w-full bg-card" aria-label={`Your ${label}`} /> : <p className="mt-2 text-xs text-muted-foreground">This take could not be recorded for replay, but the score still stands.</p>}</div>;
}

function ResultCard({ label, analysis, url }: { label: string; analysis: ToneAnalysis; url: string | null }) {
  return <div className="nb bg-card p-4"><p className="text-[10px] font-bold uppercase tracking-widest">{label}</p><p className="mt-1 font-display text-lg">{TONE_LABELS[analysis.dominantTone]?.label ?? analysis.dominantTone}</p><p className="mt-1 text-sm text-muted-foreground">{TONE_LABELS[analysis.dominantTone]?.note}</p><p className="mt-3 border-t-2 border-dashed border-ink/20 pt-3 text-sm"><span className="font-bold">Rated {analysis.overallScore}/100 — </span><span className="text-muted-foreground">{biggestLever(analysis).tip}</span></p><PlaybackPanel label={label} url={url} /></div>;
}

function fmtDelta(n: number): string { return n > 0 ? `+${n}` : `${n}`; }
