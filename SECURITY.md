# Security notes

- Never commit `.env.local`, `.env.keys`, private keys, JWT values, or deployment credentials.
- `.env.keys` is intentionally retained as an empty guard file only; all private dotenv keys belong in the deployment secrets manager.
- A dotenv private key was previously committed and must be rotated and purged from Git history before production launch. Removing the current file contents does not remove historical copies.
- Run the production smoke tests in `LAUNCH.md` after configuring secrets and the custom domain.
