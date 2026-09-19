import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));
const stubPath = fileURLToPath(new URL("./playwright/use-auth.stub.tsx", import.meta.url));

/**
 * Component-testing config — deliberately separate from the app's
 * vite.config.ts (which the platform owns). `use.ctViteConfig` merges into
 * the CT vite build only.
 *
 * Plugins: Tailwind must compile `src/index.css` (the app's neobrutalism
 * theme), and once any user plugin is present ct-core stops auto-injecting
 * the React plugin — so react() is explicit here. The platform's vlyPlugin
 * (dev toolbar) is intentionally omitted.
 *
 * Aliases: the stub entry must precede the general "@" alias. It swaps the
 * Convex-backed useAuth for a controllable stub in the CT build only — no
 * app code or real backend involved.
 *
 * Tests live in playwright/ next to the CT template (index.html/index.tsx),
 * so the app build/typecheck never treats them as routes.
 */
export default defineConfig({
  testDir: "playwright",
  testMatch: "**/*.ct.tsx",
  timeout: 15_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    ctPort: 3109,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    ctViteConfig: {
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: [
          { find: /^@\/hooks\/use-auth$/, replacement: stubPath },
          { find: "@", replacement: srcPath },
        ],
      },
      optimizeDeps: {
        include: ["react", "react-dom", "react-router", "input-otp", "lucide-react"],
      },
    },
  },
});
