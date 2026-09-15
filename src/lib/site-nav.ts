/**
 * Public-site navigation, shared by the header, mobile menu, and footer.
 * Every path here must be registered in main.tsx — site-nav.test.ts guards
 * the list so a new link without a route can't ship silently.
 */

export interface NavItem {
  to: string;
  label: string;
  /** Accent dot shown in the mobile menu. */
  dot: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/how", label: "How it works", dot: "bg-sun" },
  { to: "/tone-check", label: "Tone check", dot: "bg-coral" },
  { to: "/drills", label: "Drills", dot: "bg-mint" },
  { to: "/library", label: "Library", dot: "bg-paper" },
];

/** The public routes the router must register for the nav to be safe. */
export const PUBLIC_ROUTES = ["/", ...NAV_ITEMS.map((n) => n.to)];

/**
 * The guided tour: the natural reading order through the public site.
 * Each section page gets a back/forward pager so visitors can walk the
 * whole story — Home → How → Tone check → Drills → Library — without
 * hunting for the nav. `/` opens the tour; Library closes it.
 */
export const PAGE_ORDER: { to: string; label: string; blurb: string }[] = [
  { to: "/", label: "Home", blurb: "What ShiftedTone is" },
  { to: "/how", label: "How it works", blurb: "The three-step method" },
  { to: "/tone-check", label: "Tone check", blurb: "Find your default under pressure" },
  { to: "/drills", label: "Drills", blurb: "Pick a drill, train the tone" },
  { to: "/library", label: "Library", blurb: "Ideas from the pros" },
];

/** Prev/next stops of the tour for a given path (nulls at the ends). */
export function tourStops(
  pathname: string,
): { prev: (typeof PAGE_ORDER)[number] | null; next: (typeof PAGE_ORDER)[number] | null } {
  const i = PAGE_ORDER.findIndex((p) => p.to === pathname);
  return {
    prev: i > 0 ? PAGE_ORDER[i - 1] : null,
    next: i >= 0 && i < PAGE_ORDER.length - 1 ? PAGE_ORDER[i + 1] : null,
  };
}
