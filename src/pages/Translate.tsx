import { AppShell } from "@/components/AppShell";
import { NBBadge, NBButton, NBPanel, NBMeter, NBStat } from "@/components/nb";
import { MicError } from "@/components/MicError";
import { PreviewMicHint } from "@/components/PreviewMicHint";
import { MicPicker } from "@/components/MicPicker";
import { getSavedMicDeviceId } from "@/lib/mic-prefs";
import { ResponsePlanner } from "@/components/ResponsePlanner";
import { useToneCapture } from "@/hooks/use-tone-capture";
import { passOrder, TRANSLATION_LINES, type TranslationLine } from "@/lib/translation";
import { biggestLever, buildFactorFeedback, TONE_FACTORS, TONE_LABELS, type FactorFeedback, type FactorKey, type ToneAnalysis } from "@/lib/tone-analyzer";
import { ArrowRight, AudioLines, Languages, RefreshCw, Square, Target } from "lucide-react";
import { PACE_BAR_CLASS, PACE_HINTS, formatClock, pacePct, paceStatus, TRANSLATE_TAKE_TARGET_MS } from "@/lib/take-timing";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

type Pass = "reflex" | "intended";
type Delta = { calm: number; energy: number; clarity: number; stability: number };

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
  const [finishedPass, setFinishedPass] = useState<Pass | null>(null);
  const [lastSeen, setLastSeen] = useState<ToneAnalysis | null>(null);
  const [reflexAnalysis, setReflexAnalysis] = useState<ToneAnalysis | null>(null);
  const [intendedAnalysis, setIntendedAnalysis] = useState<ToneAnalysis | null>(null);
  const [reflexAudio, setReflexAudio] = useState<Blob | null>(null);
  const [intendedAudio, setIntendedAudio] = useState<Blob | null>(null);
  const [openFactor, setOpenFactor] = useState<{ pass: Pass; factor: FactorKey } | null>(null);
  const [experience, setExperience] = useState("");
  const done = !!reflexAnalysis && !!intendedAnalysis;

  const reflexUrl = useMemo(() => (reflexAudio ? URL.createObjectURL(reflexAudio) : null), [reflexAudio]);
  const intendedUrl = useMemo(() => (intendedAudio ? URL.createObjectURL(intendedAudio) : null), [intendedAudio]);
  useEffect(() => () => { if (reflexUrl) URL.revokeObjectURL(reflexUrl); }, [reflexUrl]);
  useEffect(() => () => { if (intendedUrl) URL.revokeObjectURL(intendedUrl); }, [intendedUrl]);

  // Score and audio arrive on separate async paths. Keep both instead of
  // taking a one-render snapshot that can leave playback empty.
  useEffect(() => {
    if (!pendingPass || !capture.analysis || capture.analysis === lastSeen) return;
    const finished = pendingPass;
    setLastSeen(capture.analysis);
    setFinishedPass(finished);
    if (finished === "reflex") setReflexAnalysis(capture.analysis);
    else setIntendedAnalysis(capture.analysis);
    setPendingPass(null);
    setPass(order.find((candidate) => candidate !== finished) ?? finished);
  }, [capture.analysis, lastSeen, order, pendingPass]);

  useEffect(() => {
    if (!capture.audioBlob || !finishedPass) return;
    if (finishedPass === "reflex") setReflexAudio(capture.audioBlob);
    else setIntendedAudio(capture.audioBlob);
  }, [capture.audioBlob, finishedPass]);

  useEffect(() => {
    if (reflexAnalysis && intendedAnalysis) mark({ action: "translate" }).catch(() => {});
  }, [reflexAnalysis, intendedAnalysis, mark]);

  const startPass = () => {
    const seed = capture.lastPeakRawRms;
    capture.reset();
    setPendingPass(null);
    setFinishedPass(null);
    capture.start(seed, getSavedMicDeviceId());
  };
  const finishPass = () => {
    if (capture.state !== "recording") return;
    setPendingPass(pass);
    capture.stop();
  };
  const restart = () => {
    capture.reset();
    setReflexAnalysis(null); setIntendedAnalysis(null);
    setReflexAudio(null); setIntendedAudio(null);
    setPendingPass(null); setFinishedPass(null); setLastSeen(null); setOpenFactor(null);
    setPass(order[0]);
  };
  const nextLine = () => {
    const index = TRANSLATION_LINES.indexOf(line);
    setLine(TRANSLATION_LINES[(index + 1) % TRANSLATION_LINES.length]);
    restart();
  };
  const delta: Delta | null = reflexAnalysis && intendedAnalysis ? {
    calm: intendedAnalysis.calmScore - reflexAnalysis.calmScore,
    energy: intendedAnalysis.energyScore - reflexAnalysis.energyScore,
    clarity: intendedAnalysis.clarityScore - reflexAnalysis.clarityScore,
    stability: intendedAnalysis.stabilityScore - reflexAnalysis.stabilityScore,
  } : null;
  const pace = paceStatus(capture.elapsedMs, TRANSLATE_TAKE_TARGET_MS);

  return <AppShell active="translate"><div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
    <div><NBBadge className="bg-sun text-ink"><Languages className="size-3" /> The Translation Drill</NBBadge><h1 className="mt-3 font-display text-3xl sm:text-4xl">Say it again. This time, mean it.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Say the line once as it usually comes out, then again the way you mean it — and compare.</p></div>
    <NBPanel className="p-6"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{done ? "Translated" : "The sentence"}</span><button type="button" onClick={nextLine} className="nb nb-press flex items-center gap-1.5 bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest"><RefreshCw className="size-3" /> Different sentence</button></div><p className="mt-3 font-display text-2xl leading-snug">“{line.text}”</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="nb bg-card p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-coral">How it usually comes out</p><p className="mt-1 text-sm text-muted-foreground">{line.usually}</p></div><div className="nb bg-card p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-mint">What you're aiming for</p><p className="mt-1 text-sm text-muted-foreground">{line.intended}</p></div></div></NBPanel>
    {!done && <ResponsePlanner title={finishedPass ? `Before the ${pass} take — think it through` : "Before you speak — think it through"} onGoalPick={setExperience} />}
    {experience && <div className="nb bg-mint px-4 py-3 text-sm"><span className="font-bold">Your goal: </span>{experience}</div>}
    {!done && <NBPanel className="p-6"><div className="flex items-stretch gap-2" role="list" aria-label="Take progress">{order.map((passKey, i) => { const analysis = passKey === "reflex" ? reflexAnalysis : intendedAnalysis; return <div key={passKey} role="listitem" aria-current={pass === passKey ? "step" : undefined} className={cn("flex-1 border-2 border-ink px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest", analysis ? "bg-mint" : pass === passKey ? "bg-sun" : "bg-card text-muted-foreground")}>{analysis ? "✓ " : ""}{i + 1} · {passKey === "reflex" ? "Reflex take" : "Intended take"}</div>; })}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><NBBadge className={pass === "reflex" ? "bg-coral text-ink" : "bg-mint text-ink"}>Pass {order.indexOf(pass) + 1} of 2 — {pass === "reflex" ? "as it usually comes out" : "as you mean it"}</NBBadge><span className="text-xs text-muted-foreground">{line.targetHint}</span></div>{/* The start button must survive take 1: after scoring, the hook sits in
    "done", not "idle" — gating on idle alone dead-ended the drill here
    with no way to record the second take. */}
{(capture.state === "idle" || capture.state === "done") && <div className="mt-5 flex flex-col items-center gap-3">{capture.state === "done" && finishedPass && <NBBadge className="bg-mint text-ink">✓ {finishedPass === "reflex" ? "Reflex" : "Intended"} take scored — one more to go</NBBadge>}<div className="flex justify-center"><NBButton onClick={startPass} variant={pass === "reflex" ? "coral" : "mint"}>Say it — {pass} take</NBButton></div></div>}{capture.state === "recording" && <div className="mt-5 w-full"><div className="h-3 w-full nb overflow-hidden bg-card"><div className={cn("h-full transition-[width] duration-300", PACE_BAR_CLASS[pace])} style={{ width: `${pacePct(capture.elapsedMs, TRANSLATE_TAKE_TARGET_MS)}%` }} /></div><div className="mt-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground"><span className="flex items-center gap-1.5"><Target className="size-3.5" /> {PACE_HINTS[pace]}</span><span>{formatClock(capture.elapsedMs)} / {formatClock(TRANSLATE_TAKE_TARGET_MS)}</span></div><p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Live pitch · {capture.livePitchHz ? `${Math.round(capture.livePitchHz)} Hz` : "listening for you…"}{capture.level < 0.06 && capture.elapsedMs > 3000 && " · we can barely hear you — move closer"}</p><div className="mt-5 flex justify-center"><NBButton onClick={finishPass} variant="ink"><Square className="size-4" /> Done — score it</NBButton></div></div>}{capture.state === "analyzing" && <div className="mt-5 text-center font-display">Analyzing…</div>}{/* Preview frames block the mic entirely — say so before the
    first failed take, not after. */}
<PreviewMicHint className="mt-5" />{capture.error && <MicError message={capture.error} />}{capture.state === "recording" && capture.micMuted && <p className="nb mt-5 bg-sun px-3 py-2 text-sm font-medium">The mic reports itself muted — check your system's mic privacy setting.</p>}<MicPicker activeLabel={capture.activeDeviceLabel} className="mt-5" />        {/* Ratings appear after EVERY take, not just after both — the
            checker panel alone after take 1 read as "it doesn't rate". */}
        {!done && (reflexAnalysis || intendedAnalysis) && <div className="mt-5 flex flex-col gap-4"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your take — rated</p>{(["reflex", "intended"] as Pass[]).filter((p) => (p === "reflex" ? reflexAnalysis : intendedAnalysis)).map((p) => <TakeResult key={p} pass={p} analysis={(p === "reflex" ? reflexAnalysis : intendedAnalysis)!} url={p === "reflex" ? reflexUrl : intendedUrl} openFactor={openFactor} setOpenFactor={setOpenFactor} />)}</div>}</NBPanel>}
    {done && delta && <Results experience={experience} analysisByPass={{ reflex: reflexAnalysis!, intended: intendedAnalysis! }} audioByPass={{ reflex: reflexUrl, intended: intendedUrl }} delta={delta} onRestart={restart} onNext={nextLine} openFactor={openFactor} setOpenFactor={setOpenFactor} />}
  </div></AppShell>;
}

function Results({ experience, analysisByPass, audioByPass, delta, onRestart, onNext, openFactor, setOpenFactor }: { experience: string; analysisByPass: Record<Pass, ToneAnalysis>; audioByPass: Record<Pass, string | null>; delta: Delta; onRestart: () => void; onNext: () => void; openFactor: { pass: Pass; factor: FactorKey } | null; setOpenFactor: (value: { pass: Pass; factor: FactorKey } | null) => void }) {
  return <NBPanel className="p-6"><div className="flex flex-wrap items-center justify-between gap-2"><NBBadge className="bg-sun text-ink">Your take ratings</NBBadge><span className="text-xs text-muted-foreground">Higher is closer to the experience you wanted.</span></div>{experience && <p className="mt-3 nb bg-mint p-3 text-sm"><span className="font-bold">Chosen goal: </span>{experience}</p>}<div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"><NBStat label="Calm Δ" value={fmtDelta(delta.calm)} /><NBStat label="Energy Δ" value={fmtDelta(delta.energy)} /><NBStat label="Clarity Δ" value={fmtDelta(delta.clarity)} /><NBStat label="Stability Δ" value={fmtDelta(delta.stability)} /></div><p className="mt-4 text-sm text-muted-foreground">Positive deltas mean the intended take beat the reflex take on that factor.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{(["reflex", "intended"] as Pass[]).map((pass) => <TakeResult key={pass} pass={pass} analysis={analysisByPass[pass]} url={audioByPass[pass]} openFactor={openFactor} setOpenFactor={setOpenFactor} />)}</div><div className="mt-5 flex flex-wrap justify-center gap-3"><NBButton onClick={onRestart} variant="paper">Redo this sentence</NBButton><NBButton onClick={onNext} variant="sun">Next sentence <ArrowRight className="size-4" /></NBButton></div></NBPanel>;
}

/**
 * Per-take result — the same rating panel as the Practice page's score
 * readout: biggest lever first, tone badge, big overall number, the four
 * expandable factor meters (status chip + read + your numbers + practice
 * tip + how it's rated + goal), then the raw stats. Only the take label
 * and the listen-back player are specific to this drill.
 */
const STATUS_STYLES: Record<FactorFeedback["status"], string> = {
  strong: "bg-mint",
  decent: "bg-sun",
  wobbly: "bg-paper",
  rough: "bg-coral",
};

function TakeResult({ pass, analysis, url, openFactor, setOpenFactor }: { pass: Pass; analysis: ToneAnalysis; url: string | null; openFactor: { pass: Pass; factor: FactorKey } | null; setOpenFactor: (value: { pass: Pass; factor: FactorKey } | null) => void }) {
  const tone = TONE_LABELS[analysis.dominantTone] ?? TONE_LABELS.mixed;
  const feedback = buildFactorFeedback(analysis);
  const lever = biggestLever(analysis);
  return (
    <div className="nb bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest">{pass === "reflex" ? "Reflex take" : "Intended take"}</p>
        <span className={cn("nb px-2 py-1 text-[10px] font-bold uppercase tracking-widest", tone.color)}>{tone.label}</span>
      </div>

      {/* The one highest-leverage fix for next time — same as Practice. */}
      <div className="nb mt-3 bg-sun p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest">Biggest lever — work this one thing next take</p>
        <p className="mt-1 text-sm font-medium">{lever.tip}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm text-muted-foreground">{tone.note}</p>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overall</div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
            className="font-display text-5xl"
          >
            {analysis.overallScore}
          </motion.div>
        </div>
      </div>

      <PlaybackPanel label={pass === "reflex" ? "Reflex take" : "Intended take"} url={url} />

      <div className="mt-4 grid gap-4">
        {(
          [
            ["calm", analysis.calmScore],
            ["energy", analysis.energyScore],
            ["clarity", analysis.clarityScore],
            ["stability", analysis.stabilityScore],
          ] as const
        ).map(([key, score]) => {
          const factor = TONE_FACTORS[key];
          const open = openFactor?.pass === pass && openFactor.factor === key;
          return (
            <div key={key} className="nb bg-card p-3">
              <button
                type="button"
                onClick={() => setOpenFactor(open ? null : { pass, factor: key })}
                aria-expanded={open}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-xs font-bold uppercase tracking-widest">{factor.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-display text-xl">{score}</span>
                  <span aria-hidden className={cn("text-[10px] font-bold transition-transform", open && "rotate-180")}>▼</span>
                </span>
              </button>
              <NBMeter value={score} className="mt-2" />
              {open && (
                <div className="mt-3 flex flex-col gap-3 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
                  <p>
                    <span className={cn("nb mr-2 inline-block bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest", STATUS_STYLES[feedback[key].status])}>
                      {feedback[key].status}
                    </span>
                    <span>{feedback[key].read}</span>
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your numbers: {feedback[key].yourNumbers}</p>
                  <p><span className="font-bold">Practice this: </span><span className="text-muted-foreground">{feedback[key].tip}</span></p>
                  <p><span className="font-bold">How it's rated: </span><span className="text-muted-foreground">{factor.how}</span></p>
                  <p><span className="font-bold">The goal: </span><span className="text-muted-foreground">{factor.goal}</span></p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="nb bg-secondary p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pitch</div>
          <div className="font-display text-lg">{analysis.avgPitchHz} Hz</div>
        </div>
        <div className="nb bg-secondary p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Range</div>
          <div className="font-display text-lg">{analysis.pitchRangeHz} Hz</div>
        </div>
        <div className="nb bg-secondary p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pace</div>
          <div className="font-display text-lg">{analysis.wordsPerMinute} wpm</div>
        </div>
        <div className="nb bg-secondary p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Voiced</div>
          <div className="font-display text-lg">{Math.round(analysis.voicedRatio * 100)}%</div>
        </div>
      </div>
    </div>
  );
}

function PlaybackPanel({ label, url }: { label: string; url: string | null }) { return <div className="mt-4 nb bg-secondary p-3"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><AudioLines className="size-4" /> Hear your {label.toLowerCase()}</div>{url ? <audio controls preload="auto" src={url} className="nb mt-2 w-full bg-card" aria-label={`Play ${label}`} onError={(event) => event.currentTarget.load()} /> : <p className="mt-2 text-xs text-muted-foreground">No audio this time — your ratings still stand.</p>}</div>; }
function fmtDelta(n: number): string { return n > 0 ? `+${n}` : `${n}`; }
