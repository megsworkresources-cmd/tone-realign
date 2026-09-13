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
