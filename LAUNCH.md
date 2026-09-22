# ShiftedTone — Launch Checklist

Everything listed under **Done in code** is reproducible from the repo with the
commands shown. The remaining sections need account access (secrets manager,
domain registrar, hosting dashboard) and **§0 is a hard blocker** — do not
launch before it is complete.

## ✅ Done in code (verifiable)

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
  auth context (row-level isolation across `sessions`, `reframes`,
  `dailyLog`, `coachNotes`, `users`); no unauthenticated table access
- **Secret hygiene**: `.env.keys` reduced to a comments-only guard file; no
  secret patterns (private keys, JWTs, provider tokens, hardcoded
  credentials) in tracked source; `.gitignore` covers `.env.keys` /
  `.env.local` / archives / build output. See `SECURITY.md`.
- **Verification commands** (re-run any time):
  `bun tsc -b --noEmit` · `bun test` · `bun run build` ·
  `bun scripts/validate-og.ts` (OG PNG structure/CRCs)
- **Component tests**: Playwright CT (`@playwright/experimental-ct-react`)
  covers the auth page's email → OTP → guest flows against a stubbed
  `useAuth` (no backend needed): `bun run test:ct` — 10 tests in
  `playwright/Auth.ct.tsx`. First run on a fresh machine needs browser deps:
  `bunx playwright install --with-deps chromium`.

## 0. Secret rotation (REQUIRED before launch — hard blocker)

A dotenvx private key was previously committed to this repository (in the
`.env.keys` file). The working-tree copy is now comments only — **that does
not fix the leak**:

> Removing or emptying the current file does **not** remove copies from Git
> history. Every historical commit containing the value still exposes it,
> GitHub may serve cached copies of unreachable commits even after a
> force-push, and any fork or clone made before the purge retains the value.

The exposed key must be treated as compromised. Do these **in order**:

1. **Rotate / revoke the exposed key first.** Rotation is the real fix;
   history purge only limits further exposure.
   - Regenerate the dotenvx private key (dotenvx rotate / new key pair) and
     re-encrypt — or simply delete — any `.env` files that used it.
   - Audit what the key protected: if any secret it encrypted (JWT key
     material, integration tokens) is considered exposed, rotate those too,
     via the **deployment secrets manager** (Keys/API keys UI, Convex
     dashboard, Vercel Environment Variables) — never by committing
     replacements.
   - Confirm the old key no longer decrypts anything before continuing.
2. **Purge the old value from Git history** (destructive — coordinate with
   any collaborators first; they must re-clone afterwards):
   ```bash
   # Recommended: git-filter-repo (pip install git-filter-repo)
   git clone --bare https://github.com/megsworkresources-cmd/tone-realign.git
   cd tone-realign.git
   git filter-repo --path .env.keys --invert-paths
   git push --force --all
   git push --force --tags
   ```
   Alternative: BFG Repo-Cleaner (`bfg --delete-files .env.keys`) followed by
   `git reflog expire --expire=now --all && git gc --prune=now --aggressive`.
3. **Close the remaining exposure windows:**
   - Ask GitHub Support to clear cached views of the unreachable commits
     (commit URLs and API/event endpoints can keep serving content after a
     force-push).
   - Have all collaborators re-clone; old clones still contain the secret.
   - Never re-print the old value in issues, PRs, chat, or commit messages
     while remediating.
4. **Then verify:** the purge commit history contains no `.env.keys` content,
   and the replacement key exists only in the secrets manager.

## 1. Production environment variables (via the secrets manager)

Set these in the deployment secrets manager (Keys/API keys UI, Convex
dashboard, Vercel Environment Variables) — **never in committed files**:

| Variable | Where | Purpose |
|---|---|---|
| `VITE_CONVEX_URL` | Vercel / hosting env | Convex deployment URL the browser uses — must point at the **production** deployment |
| `VITE_PLAUSIBLE_DOMAIN` | Vercel / hosting env | Optional: activates Plausible analytics (absent = no-op) |
| `VITE_PLAUSIBLE_API_HOST` | Vercel / hosting env | Optional: only for self-hosted/proxied Plausible |
| `VLY_INTEGRATION_KEY` | Keys UI / Convex env | Platform integrations deployment token (AI coach) |
| `JWKS`, `JWT_PRIVATE_KEY` | Convex deployment env | Convex Auth JWT signing/verification material |
| `SITE_URL`, `CONVEX_SITE_URL` | Convex deployment env | Production origin for auth callbacks / CORS |

`.env.example` documents every variable with placeholders only.

## 2. Choose ONE production hosting target — and test that one

The repo contains configuration for **two different hosting targets**, which
are not interchangeable. Pick **one** production target, deploy to it, and
run the entire smoke-test list (§5) against **that** deployment before
launching:

- **`vercel.json`** — SPA rewrites to `/index.html` for the Vercel target:
  build with `npm run build` (i.e. `tsc -b && vite build`), serve `dist/`,
  env vars in Vercel settings. Vercel auto-deploys on push to `main`.
- **`main.ts`** — a Hono + Deno static file server for `./dist` (SPA fallback
  to `index.html`): the Deno Deploy target, configured separately.

Do not half-deploy to both, and do not smoke-test one target and launch the
other. Whichever you choose, also deploy the Convex production backend once
(`npx convex deploy`) and point `VITE_CONVEX_URL` at it before testing.

## 3. Custom domain (shiftedtone.com)

1. Register/park `shiftedtone.com` at your registrar (Cloudflare DNS
   recommended — free, fast propagation).
2. In the **selected** hosting target's dashboard, add `shiftedtone.com` and
   `www.shiftedtone.com`.
3. At your registrar, point DNS per the host's instructions, typically:
   - `A` record: `@` → host's apex IP(s)
   - `CNAME`: `www` → host's domain target
4. Wait for the TLS certificate to issue (usually < 5 min).

After DNS resolves, update the canonical/OG URLs in `index.html`,
`robots.txt`, and `sitemap.xml` **only if** you end up on a different domain
than `https://shiftedtone.com/` (they already assume it).

## 4. Analytics activation (Plausible)

1. Create a site at [plausible.io](https://plausible.io) for
   `shiftedtone.com`.
2. Add `VITE_PLAUSIBLE_DOMAIN` = `shiftedtone.com` in the hosting target's
   environment settings (secrets manager, not committed files).
3. Redeploy. Pageviews and funnel events flow automatically; nothing else to
   wire. If the var is absent, tracking is a silent no-op (no console noise).

Optional: add `VITE_PLAUSIBLE_API_HOST` if you self-host Plausible or proxy
it through a custom subdomain.

## 5. Pre-launch smoke test (run on the selected production target)

- [ ] §0 complete: key rotated/revoked and history purged (hard blocker)
- [ ] Sign up → dashboard → run a drill → save → progress reflects it
- [ ] Sign out → `/dashboard` redirects to `/auth?returnTo=/dashboard`
- [ ] Sign back in → lands back on `/dashboard`
- [ ] Mic permission denied → inline error, no crash
- [ ] Offline/throttled network → toasts show failure, no silent data loss
- [ ] **Convex authorization**: sign in as user A, verify user B's sessions/
      logs/notes are never readable or writable from user A's account (every
      function filters by `userId`)
- [ ] CORS on Convex HTTP actions restricted to the production origin
- [ ] `VITE_CONVEX_URL` points at the production Convex deployment (not dev)
- [ ] No committed secrets: history clean after §0, secrets only in the
      secrets manager
- [ ] **Ops tooling removed**: the `/push-source` page, its route, and
      `src/convex/githubPush.ts` deleted (or confirmed disabled on production
      hosts) — it is an unauthenticated ops endpoint and must not ship live
- [ ] Lighthouse mobile pass ≥ 90 on `/`
- [ ] OG preview renders (paste the URL in Discord/Slack/iMessage)
