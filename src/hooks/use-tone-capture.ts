import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzeFrames,
  detectPitch,
  type ToneAnalysis,
  type ToneFrame,
} from "@/lib/tone-analyzer";

export type CaptureState = "idle" | "recording" | "analyzing" | "done";

interface UseToneCapture {
  state: CaptureState;
  error: string | null;
  level: number; // 0..1 live loudness
  livePitchHz: number | null;
  elapsedMs: number;
  analysis: ToneAnalysis | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

const FRAME_INTERVAL_MS = 50;

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

  const framesRef = useRef<ToneFrame[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const lastFrameAtRef = useRef(0);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setAnalysis(null);
    framesRef.current = [];
    setLevel(0);
    setLivePitchHz(null);
    setElapsedMs(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const timeBuf = new Float32Array(analyser.fftSize);
      startedAtRef.current = performance.now();
      lastFrameAtRef.current = 0;
      setState("recording");

      const loop = () => {
        const now = performance.now();
        analyser.getFloatTimeDomainData(timeBuf);

        // RMS level for the live meter
        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) sum += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(sum / timeBuf.length);
        setLevel(Math.min(rms * 3, 1));

        // Frame capture at fixed cadence for analysis
        if (now - lastFrameAtRef.current >= FRAME_INTERVAL_MS) {
          lastFrameAtRef.current = now;
          const pitch = detectPitch(timeBuf, ctx.sampleRate);
          framesRef.current.push({ pitchHz: pitch, volume: rms, timestamp: now });
          setLivePitchHz(pitch);
        }

        setElapsedMs(now - startedAtRef.current);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      cleanup();
      setState("idle");
      setError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone access was blocked. Enable it in your browser settings and try again."
          : "Could not access your microphone. Check that one is connected and try again.",
      );
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    if (rafRef.current === null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    setState("idle");
    setError(null);
    setAnalysis(null);
    setLevel(0);
    setLivePitchHz(null);
    setElapsedMs(0);
    framesRef.current = [];
  }, [cleanup]);

  return { state, error, level, livePitchHz, elapsedMs, analysis, start, stop, reset };
}
