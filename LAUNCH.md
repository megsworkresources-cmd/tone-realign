# ShiftedTone — Launch Checklist

Everything code-side is done. The remaining steps below need account access
(domain registrar, analytics dashboard) and can't be completed from the repo.

## ✅ Done in code

- **Metadata**: branded title, description, Open Graph + Twitter cards,
  canonical URL, theme-color for light/dark (`index.html`)
- **Favicon**: multi-size `/favicon.ico` (16/32/48), PWA icons (192, 512,
  maskable 512) generated from the logo bars by `bun run icons`
- **Manifest**: branded `manifest.webmanifest` with correct theme colors
- **SEO**: `robots.txt` (private pages disallowed) + `sitemap.xml` (public
  pages only)
- **Analytics**: Plausible wired via `src/lib/analytics.ts` — SPA pageviews on
  route change plus funnel events (`cta_get_started`, `cta_watch`,
  `auth_success`, `auth_signout`, `daily_challenge_start`, `session_saved`,
  `runtime_error`). Safe no-op when unconfigured.
- **Error UX**: production-ready error dialog (no dev-facing copy), global
  boundary reporting to analytics
- **A11y**: visible high-contrast focus rings, `prefers-reduced-motion`
  support, scroll-margin for anchored sections
- **Data security**: every Convex query/mutation filters by `userId` from the
  auth context (row-level isolation verified across `sessions`, `reframes`,
  `dailyLog`, `coachNotes`, `users`); no unauthenticated table access
- **Cleanup**: removed stale `isolate/` build output, template junk, dead
  console logs, and `.DS_Store` files
- **Verification**: `bun tsc -b --noEmit` ✓ · 246 tests pass ✓ · `bun run build` ✓ · OG card validated ✓
- **Component tests**: Playwright CT (`@playwright/experimental-ct-react`) covers the auth page's
  email → OTP → guest flows against a stubbed `useAuth` (no backend needed):
  `bunx playwright test -c playwright-ct.config.ts` — 10 tests in `playwright/Auth.ct.tsx`.

## 1. Custom domain (shiftedtone.com)

The app is served from the Freebuff staging domain. To go live:

1. Register/park `shiftedtone.com` at your registrar (Cloudflare DNS
   recommended — free, fast propagation).
2. In the hosting provider's dashboard (Freebuff publish → custom domains, or
   Vercel/Netlify if you host the built `dist/` yourself), add
   `shiftedtone.com` and `www.shiftedtone.com`.
3. At your registrar, point DNS per the host's instructions, typically:
   - `A` record: `@` → host's apex IP(s)
   - `CNAME`: `www` → host's domain target
4. Wait for the TLS certificate to issue (usually < 5 min on Vercel/Netlify).

After DNS resolves, update the canonical/OG URLs in `index.html`,
`robots.txt`, and `sitemap.xml` **only if** you end up on a different domain
than `https://shiftedtone.com/` (they already assume it).

## 2. Analytics activation (Plausible)

The Plausible script is injected only when the domain env var is set:

1. Create a site at [plausible.io](https://plausible.io) for
   `shiftedtone.com`.
2. Add the key in the project's **Keys / API keys** UI:
   - `VITE_PLAUSIBLE_DOMAIN` = `shiftedtone.com`
3. Redeploy. Pageviews and funnel events flow automatically; nothing else to
   wire. If the var is absent, tracking is a silent no-op (no console noise).

Optional: add `VITE_PLAUSIBLE_API_HOST` if you self-host Plausible or proxy
it through a custom subdomain (e.g. `/plausible.io/script.js` proxy for
ad-blocker resistance).

## 3. Security posture notes

- **Convex ≠ Postgres RLS.** Convex enforces authorization *inside each
  function*: every query and mutation must read the authenticated user
  (`getAuthUserId`) and filter reads/writes by it. This is the Convex
  equivalent of row-level security and is already implemented on every
  user-data table. Keep it that way for all new tables — never expose a query
  that reads `withIndex` without a `userId` filter.
- **Auth config** lives in `src/convex/auth.ts` (Convex Auth). Session
  cookies are httpOnly; no tokens are stored in localStorage.
- **HTTP actions** (`src/convex/http.ts`) should keep CORS restricted to the
  production origin before launch.

## 4. Pre-launch smoke test

- [ ] Sign up → dashboard → run a drill → save → progress reflects it
- [ ] Sign out → `/dashboard` redirects to `/auth?returnTo=/dashboard`
- [ ] Sign back in → lands back on `/dashboard`
- [ ] Mic permission denied → inline error, no crash
- [ ] Offline/throttled network → toasts show failure, no silent data loss
- [ ] Lighthouse mobile pass ≥ 90 on `/`
- [ ] OG preview renders (paste the URL in Discord/Slack/iMessage)
