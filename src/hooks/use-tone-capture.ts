import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzeFrames,
  detectPitch,
  type ToneAnalysis,
  type ToneFrame,
} from "@/lib/tone-analyzer";
import {
  gainedVolume,
  isDeadTake,
  isSpeechLevel,
  SOFTWARE_GAIN,
} from "@/lib/capture-gain";

export type CaptureState = "idle" | "recording" | "analyzing" | "done";

interface UseToneCapture {
  state: CaptureState;
  error: string | null;
  level: number; // 0..1 live loudness
  livePitchHz: number | null;
  elapsedMs: number;
  analysis: ToneAnalysis | null;
  /** Best-effort live speech-to-text of the take (empty when unsupported). */
  transcript: string;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

const FRAME_INTERVAL_MS = 50;
/**
 * Gain staging, speech gating, and dead-mic thresholds live in
 * src/lib/capture-gain.ts (pure + unit-tested); the hook applies them.
 */

// Minimal structural typing for the Web Speech API (not in lib.dom for all
// browsers, and webkit prefixes the constructor) — no `any` escapes here.
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((
        event: {
          resultIndex: number;
          results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
        },
      ) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Records a microphone take and analyzes tone.
 * Live state (level, pitch) drives the visualizer; stop() produces the full analysis.
 */
export function useToneCapture(): UseToneCapture {
  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [livePitchHz, setLivePitchHz] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [analysis, setAnalysis] = useState<ToneAnalysis | null>(null);
  const [transcript, setTranscript] = useState("");

  const framesRef = useRef<ToneFrame[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  /** Gained copy of the analyser buffer, reused per frame (no per-frame alloc). */
  const gainedBufRef = useRef<Float32Array | null>(null);
  /** Speech-level frames captured this take — drives dead-mic detection. */
  const speechFramesRef = useRef(0);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    gainedBufRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    // Double-start guard: a second click while awaiting getUserMedia would
    // orphan the first stream (its tracks are only stopped via cleanup of
    // the refs it would overwrite). Ignore re-entry.
    if (rafRef.current !== null) return;
    setError(null);
    setAnalysis(null);
    framesRef.current = [];
    speechFramesRef.current = 0;
    setLevel(0);
    setLivePitchHz(null);
    setElapsedMs(0);
    setTranscript("");
    transcriptRef.current = "";

    // Create the AudioContext synchronously, inside the click gesture.
    // Creating it after the `await getUserMedia` below breaks user
    // activation — Chrome then returns a *suspended* context and the
    // analyser reads pure silence for the whole take.
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // Some browsers still park the context in "suspended" (Safari, or a
      // permission prompt that ate the gesture) — nudge it to running.
      if (ctx.state !== "running") {
        await ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const timeBuf = new Float32Array(analyser.fftSize);
      const gainedBuf = new Float32Array(analyser.fftSize);
      gainedBufRef.current = gainedBuf;
      startedAtRef.current = performance.now();
      lastFrameAtRef.current = 0;
      setState("recording");

      // Best-effort transcript for the coach — silence on any failure.
      const Recognition = getSpeechRecognition();
      if (Recognition) {
        try {
          const recognition = new Recognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = navigator.language || "en-US";
          recognition.onresult = (event) => {
            let next = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) next += result[0].transcript + " ";
            }
            if (next) {
              transcriptRef.current = (transcriptRef.current + " " + next).trim();
              setTranscript(transcriptRef.current);
            }
          };
          recognition.onerror = () => {};
          recognition.onend = () => {};
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          recognitionRef.current = null;
        }
      }

      const loop = () => {
        const now = performance.now();
        analyser.getFloatTimeDomainData(timeBuf);

        // RMS level for the live meter (gained so quiet mics feel alive)
        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) sum += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(sum / timeBuf.length);
        const gainedRms = gainedVolume(rms);
        setLevel(Math.min(gainedRms * 4, 1));

        // Frame capture at fixed cadence for analysis
        if (now - lastFrameAtRef.current >= FRAME_INTERVAL_MS) {
          lastFrameAtRef.current = now;
          let pitch: number | null = null;
          // Speech-gate the pitch detector: room tone gains below the
          // speech floor, so silence can't produce garbage "pitch" and
          // dilute the voiced ratio.
          if (isSpeechLevel(gainedRms)) {
            speechFramesRef.current += 1;
            for (let i = 0; i < timeBuf.length; i++) {
              gainedBuf[i] = timeBuf[i] * SOFTWARE_GAIN;
            }
            pitch = detectPitch(gainedBuf, ctx.sampleRate);
          }
          framesRef.current.push({
            pitchHz: pitch,
            volume: gainedRms,
            timestamp: now,
          });
          setLivePitchHz(pitch);
        }

        setElapsedMs(now - startedAtRef.current);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      cleanup();
      setState("idle");
      const name = e instanceof Error ? e.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Enable it for this site in your browser settings and try again."
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "No microphone found. Connect one (or pick the right input in your browser's site settings) and try again."
            : name === "NotReadableError" || name === "TrackStartError"
              ? "Your microphone is busy — close other apps that might be using it and try again."
              : "Could not access your microphone. Check that one is connected and try again.",
      );
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    if (rafRef.current === null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    // Dead-mic check: if the take never contained speech-level frames,
    // the "analysis" would be noise dressed up as scores. Say so instead.
    if (isDeadTake(speechFramesRef.current)) {
      cleanup();
      setState("idle");
      setError(
        "We couldn't hear you — check that the right mic is selected, move closer, and speak up.",
      );
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // transcript is best-effort
    }
    const durationMs = performance.now() - startedAtRef.current;
    setState("analyzing");
    setLevel(0);

    // Let the UI paint the analyzing state before the (sync) aggregation
    window.setTimeout(() => {
      const result = analyzeFrames(framesRef.current, durationMs);
      setAnalysis(result);
      setState("done");
      cleanup();
    }, 60);
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    try {
      recognitionRef.current?.abort();
    } catch {
      // transcript is best-effort
    }
    recognitionRef.current = null;
    setState("idle");
    setError(null);
    setAnalysis(null);
    setLevel(0);
    setLivePitchHz(null);
    setElapsedMs(0);
    setTranscript("");
    transcriptRef.current = "";
    framesRef.current = [];
    speechFramesRef.current = 0;
  }, [cleanup]);

  return {
    state,
    error,
    level,
    livePitchHz,
    elapsedMs,
    analysis,
    transcript,
    start,
    stop,
    reset,
  };
}
