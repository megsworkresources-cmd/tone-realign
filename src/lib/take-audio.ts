/**
 * Take-audio policy — pure, unit-testable rules for recording practice
 * takes for listen-back. Browser API probing (MediaRecorder) is guarded
 * at runtime so the same module imports cleanly from Convex server code,
 * which validates uploads against these rules before attaching a blob
 * to a practice session.
 */

/**
 * Hard cap on a stored take's audio. A 90-second opus take is well under
 * 1 MB, so 10 MB is a generous ceiling that still blocks runaway blobs.
 */
export const MAX_TAKE_AUDIO_BYTES = 10 * 1024 * 1024;

/**
 * Bare mime types (no codecs parameter) the server will attach to a
 * session. MediaRecorder in the wild produces audio/webm (Chromium),
 * audio/mp4 (Safari/iOS), and audio/ogg (older Firefox).
 */
const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/aac",
] as const;

/** Strip codecs parameters and casing: "audio/webm;codecs=opus" → "audio/webm". */
export function normalizeMimeType(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

/** True when the (already-uploaded or to-be-uploaded) type is an audio container. */
export function isAllowedTakeAudioMime(mime: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(normalizeMimeType(mime));
}

/** True for a plausible, non-empty blob inside the size cap. */
export function isTakeAudioSizeOk(bytes: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_TAKE_AUDIO_BYTES;
}

/**
 * Ordered containers for MediaRecorder. Keep this list deliberately broad:
 * Chromium prefers WebM, Safari commonly exposes MP4, and Firefox exposes
 * Ogg. Codec probing is best-effort because older Safari implementations
 * have MediaRecorder but no isTypeSupported method.
 */
const RECORD_MIME_PREFERENCE = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

/**
 * Return the first container this browser can record, or null when recording
 * is unavailable. When a browser has MediaRecorder but omits the optional
 * isTypeSupported API, return the first commonly supported container rather
 * than disabling replay entirely — the constructor remains the final probe.
 */
export function pickTakeAudioMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const supports = MediaRecorder.isTypeSupported;
  if (typeof supports !== "function") return RECORD_MIME_PREFERENCE[0];

  for (const mime of RECORD_MIME_PREFERENCE) {
    try {
      if (supports.call(MediaRecorder, mime)) return mime;
    } catch {
      // Keep probing other containers.
    }
  }
  return null;
}
