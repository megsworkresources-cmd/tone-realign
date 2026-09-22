# Security Policy

## Secret handling — the rules

- **Never commit** `.env.local`, `.env.keys`, JWT values (`JWKS`,
  `JWT_PRIVATE_KEY`), private keys, or deployment credentials
  (`VLY_INTEGRATION_KEY`, API tokens) to Git — not even temporarily, not even
  in a private repo.
- All secrets are configured through the **deployment secrets manager**: the
  project's Keys/API keys UI, the Convex dashboard environment variables, or
  your host's (Vercel) Environment Variables. `.env.example` lists every
  variable the app reads, with placeholders only.
- `.env.keys` is intentionally retained in the working tree as a
  **comments-only guard file**. It must never contain a real dotenvx private
  key again; it stays unencrypted and ignored by Git (`.gitignore`).
- dotenvx (or similar) encryption keys are not a substitute for the secrets
  manager. If you use dotenvx locally, keep its private key out of the repo
  and out of shell history.
- Frontend `VITE_*` variables are embedded in the shipped JavaScript bundle.
  Treat them as public: only non-secret configuration may use that prefix.
- If a secret ever lands in Git, treat it as compromised immediately:
  rotate/revoke first, purge history second (see below).

## Known incident: previously committed dotenvx private key

A dotenvx private key was previously committed to this repository (in the
`.env.keys` file). The working-tree copy has been emptied to comments only,
**but the key must be treated as compromised**.

Two things are required before production launch, in this order:

1. **Rotate/revolve the exposed key** in the dotenvx / deployment secrets
   manager. Rotation is the real fix — purging history only limits further
   exposure. Re-encrypt or remove any encrypted `.env` files that used it.
2. **Purge the old value from Git history.** Removing or emptying the
   current file does **not** remove copies from Git history: every historical
   commit that contains the value still exposes it, GitHub serves cached
   unreachable commits through its API and event streams after a force-push,
   and any fork or clone retains it. The exact runbook is in
   [LAUNCH.md §0](LAUNCH.md#0-secret-rotation-required-before-launch).

The old value must never be re-printed in issues, pull requests, chat, or
commit messages while remediating.

## Application security posture

- **Convex authorization:** Convex has no row-level security. Every query and
  mutation must read the authenticated user (`getAuthUserId`) and filter
  reads/writes by `userId`. This is implemented on all user-data tables
  (`sessions`, `reframes`, `dailyLog`, `coachNotes`, `users`) and must be
  preserved for every new function. Verify per the checklist in
  [LAUNCH.md](LAUNCH.md) before launch.
- **Auth sessions** (Convex Auth) use httpOnly cookies; no tokens are stored
  in `localStorage`.
- **HTTP actions** (`src/convex/http.ts`) must keep CORS restricted to the
  production origin.
- The one-shot `/push-source` ops page accepts a GitHub token per-call from
  the operator's browser, never persists it, and the token should be revoked
  on GitHub immediately after use. Consider removing the page after the
  source is published.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner.
Do not open public issues containing secrets, session data, or exploit steps
against production.
