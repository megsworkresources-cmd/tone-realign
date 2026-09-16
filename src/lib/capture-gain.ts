/**
 * Capture gain-staging — the pure decision logic behind the mic fix.
 *
 * autoGainControl stays OFF during recording (browser AGC smears the
 * dynamics the analyzer measures). Instead of a fixed software gain, the
 * pipeline tracks a mutable *input gain*: every raw sample passes through
 * `gainedVolume(raw, gain)`, and `calibrateInputGain` raises the gain when
 * loud speech still lands below the speech floor — so very quiet laptop
 * mics (raw RMS ~0.01) get heard without smearing the dynamics above the
 * floor.
 *
 * Everything here is pure: the hook owns the mutable state and applies
 * these functions per frame.
 */

/** Analysis-only multiplier applied to the raw mic signal, on top of the
 * adaptive input gain. Pitch detection is scale-invariant; only
 * loudness-based scoring sees this. */
export const SOFTWARE_GAIN = 2.5;

/** Loudest recorded volume, so hot mics never saturate the scores. */
export const MAX_RECORDED_VOLUME = 0.8;

/** Gained volume at/above which a frame counts as speech (not room tone). */
export const SPEECH_FLOOR = 0.05;

/** Fewer speech-level frames than this ≈ the mic never heard you. */
export const MIN_SPEECH_FRAMES = 5;

/** Max multiplier the adaptive input gain may reach. */
export const MAX_INPUT_GAIN = 8;

/** Sample size for calibration, and when to recalibrate mid-take. */
export const CALIBRATION_WINDOW = 40;
export const RECALIBRATE_EVERY = 200;

/** Raw mic RMS → recorded volume through the given input gain, clamped. */
export function gainedVolume(rawRms: number, inputGain = 1): number {
  return Math.min(rawRms * SOFTWARE_GAIN * inputGain, MAX_RECORDED_VOLUME);
}

/** Does this gained volume clear the speech floor? */
export function isSpeechLevel(gainedRms: number): boolean {
  return gainedRms >= SPEECH_FLOOR;
}

/** A take whose frames never reached speech level is a dead-mic take. */
export function isDeadTake(speechFrameCount: number): boolean {
  return speechFrameCount < MIN_SPEECH_FRAMES;
}

/** Is this raw sample a loud peak (as opposed to ordinary speech)? */
export function isPeak(rawRms: number): boolean {
  return rawRms > 0.15;
}

/**
 * Next input gain, given the max raw RMS observed since the last pass.
 * * Silent so far → unchanged.
 * * Loud peaks present → input is hot; relax back toward 1.
 * * Speech observed but everything below the floor → raise the gain so
 *   their normal voice crosses it.
 * * Speech already above the floor → unchanged (never chase).
 */
export function calibrateInputGain(currentGain: number, maxRawRms: number): number {
  if (maxRawRms <= 0) return currentGain;
  if (isPeak(maxRawRms)) return Math.max(1, currentGain / 2);
  const loudestGained = gainedVolume(maxRawRms, currentGain);
  if (loudestGained >= SPEECH_FLOOR) return currentGain;
  return Math.min(MAX_INPUT_GAIN, currentGain * 2);
}

/** Raw amplitude below this, nothing will bring it to speech level. */
export const HOPELESS_RAW_FLOOR = SPEECH_FLOOR / (SOFTWARE_GAIN * MAX_INPUT_GAIN);

/** Why a take failed to produce speech-level frames. */
export type DeadTakeReason =
  | "muted" // absolutely nothing came in
  | "too-quiet" // audio arrived but stayed far below the floor
  | "soft" // nearly there — closer to the mic should do it
  | "no-speech"; // audio present, floor crossed, but too few frames

/** Pick the honest reason a take had too few speech frames. */
export function deadTakeReason(
  frameCount: number,
  maxRawRms: number,
): DeadTakeReason {
  if (maxRawRms < 0.0005) return "muted";
  if (maxRawRms < HOPELESS_RAW_FLOOR) return "too-quiet";
  const loudestGained = gainedVolume(maxRawRms);
  if (loudestGained >= SPEECH_FLOOR * 0.5) return "soft";
  return "no-speech";
}

/** The user-facing message for each dead-take verdict. */
export const DEAD_TAKE_MESSAGES: Record<DeadTakeReason, string> = {
  muted:
    "We heard nothing at all — check that the right mic is selected and that it isn't muted (browser permissions, system input volume, or a hardware mute switch).",
  "too-quiet":
    "We could barely hear you. Move closer to the mic, raise your input volume in system settings, and try again.",
  soft:
    "You're coming through, just faintly — get a little closer to the mic and speak up.",
  "no-speech":
    "That take was too short to score — speak a few full sentences and stop when you're done.",
};

/**
 * The final dead-take message, enriched with what the stream itself
 * reported. Pure so the enrichment rules are unit-testable:
 * * a track that says it's muted points at the OS privacy layer or
 *   another app holding the mic — the generic "check settings" text
 *   would mislead;
 * * a known device label names the input that heard nothing — a virtual
 *   cable or "Stereo Mix" is the top wrong-device culprit;
 * * anything else keeps the base verdict unchanged.
 */
export function deadTakeMessageFor(
  reason: DeadTakeReason,
  trackMuted: boolean,
  trackLabel: string,
): string {
  if (reason !== "muted") return DEAD_TAKE_MESSAGES[reason];
  if (trackMuted) {
    return "Your microphone opened but reported itself muted the whole take. Check the OS microphone privacy setting for your browser, close apps that may hold the mic (Zoom, Teams, Discord), then try again.";
  }
  if (trackLabel) {
    return (
      DEAD_TAKE_MESSAGES.muted +
      ` Active input: “${trackLabel}” — if that isn't your real microphone (e.g. a virtual cable or “Stereo Mix”), switch it below and try again.`
    );
  }
  return DEAD_TAKE_MESSAGES.muted;
}

/**
 * The adaptive input gain a take should start with, given the peak raw
 * level the last take reached. Deterministic so tests are stable.
 */
export function initialInputGain(lastTakeMaxRawRms: number | null): number {
  if (lastTakeMaxRawRms === null) return 1;
  let gain = 1;
  let prev = -1;
  while (gain !== prev) {
    prev = gain;
    gain = calibrateInputGain(gain, lastTakeMaxRawRms);
  }
  return gain;
}
