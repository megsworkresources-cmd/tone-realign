/**
 * Privacy-friendly analytics (Plausible) — cookie-free, no PII, GDPR-friendly.
 *
 * The script is injected only when VITE_PLAUSIBLE_DOMAIN is set (your site
 * domain in the Plausible dashboard, e.g. "shiftedtone.com"). Without it every
 * call below is a safe no-op, so local dev and staging never phone home.
 *
 * Key points by design:
 * - No cross-site script is ever loaded without the env var.
 * - Event names are snake_case per Plausible's custom-event rules.
 * - We deliberately send no user identifiers — only the event name + props.
 */

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
const SCRIPT_SRC = "https://plausible.io/js/script.manual.js";
const SCRIPT_ID = "plausible-analytics";

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

/** Inject the Plausible script once, on first tracked pageview. */
function ensureScript(): void {
  if (typeof document === "undefined" || !DOMAIN) return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.dataset.domain = DOMAIN;
  document.head.appendChild(script);
}

/**
 * Track a pageview. Plausible auto-tracks the initial load; call this from
 * the router on every subsequent SPA navigation.
 */
export function trackPageview(path?: string): void {
  if (!DOMAIN) return;
  ensureScript();
  window.plausible?.("pageview", path ? { props: { path } } : undefined);
}

/** Track a named product event (onboarding, drills, coach notes, errors…). */
export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (!DOMAIN) return;
  ensureScript();
  // Plausible requires snake_case event names; normalize defensively.
  const name = event.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
  window.plausible?.(name, props ? { props } : undefined);
}
