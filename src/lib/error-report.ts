/**
 * Pure helpers for normalizing runtime errors into display/report shapes.
 * Extracted from instrumentation.tsx so the normalization rules can be
 * unit tested.
 */

/**
 * Normalize an unhandled promise-rejection reason into a message + stack.
 * Rejections may carry Error objects, plain strings, or arbitrary values —
 * every case must produce a finite, non-empty message.
 */
export function normalizeRejection(reason: unknown): {
  error: string;
  stack: string;
} {
  if (reason instanceof Error) {
    return { error: reason.message, stack: reason.stack ?? "" };
  }
  if (typeof reason === "string" && reason.length > 0) {
    return { error: reason, stack: "" };
  }
  return { error: "Unhandled promise rejection", stack: "" };
}

/**
 * Decide whether a global `error` event is a real runtime error.
 * Resource-loading failures (img/css/script — e.g. a blocked thumbnail)
 * surface on window error events with no Error object; those are not app
 * errors and must not trigger the error dialog.
 */
export function isRuntimeError(event: { error: unknown }): boolean {
  return event.error != null;
}
