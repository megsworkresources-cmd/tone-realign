/**
 * Capture gain-staging — the pure decision logic behind the mic fix.
 *
 * autoGainControl stays OFF during recording (browser AGC smears the
 * dynamics the analyzer measures), so quiet laptop mics present raw RMS
 * around 0.02–0.04 — below the analyzer's speech floors. Software gain
 * before analysis puts normal speech where the scores expect it. Pitch
 * detection is scale-invariant, so only loudness-based math moves.
 */

/** Analysis-only multiplier applied to the raw mic signal. */
export const SOFTWARE_GAIN = 2.5;

/** Loudest recorded volume, so hot mics never saturate the scores. */
export const MAX_RECORDED_VOLUME = 0.8;

/** Gained RMS at/above which a frame counts as speech (not room tone). */
export const SPEECH_FLOOR = 0.05;

/** Fewer speech-level frames than this ≈ the mic never heard you. */
export const MIN_SPEECH_FRAMES = 5;

/** Raw mic RMS → recorded volume: gained, clamped below saturation. */
export function gainedVolume(rawRms: number): number {
  return Math.min(rawRms * SOFTWARE_GAIN, MAX_RECORDED_VOLUME);
}

/** Does this gained volume clear the speech floor? */
export function isSpeechLevel(gainedRms: number): boolean {
  return gainedRms >= SPEECH_FLOOR;
}

/** A take whose frames never reached speech level is a dead-mic take. */
export function isDeadTake(speechFrameCount: number): boolean {
  return speechFrameCount < MIN_SPEECH_FRAMES;
}
