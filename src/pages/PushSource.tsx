import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Github, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * One-shot ops page: pushes the packaged source snapshot to GitHub
 * (megsworkresources-cmd/ShiftedTone main) via the githubPush publishSource
 * action. The fine-grained token is pasted per-run, kept in component state
 * only, sent straight to the action, and never stored server-side — revoke it
 * on GitHub once the push lands.
 */
export default function PushSource() {
  const publish = useAction(api.githubPush.publishSource);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [result, setResult] = useState<string>("");
  const [tokenError, setTokenError] = useState("");

  async function run() {
    const trimmed = token.trim();
    if (!trimmed) {
      setTokenError("Paste a fine-grained token with Contents: Read and write first.");
      return;
    }
    setTokenError("");
    setStatus("working");
    setResult("Fetching packaged source…");
    try {
      const res = await fetch("/shiftedtone-source.zip");
      if (!res.ok) throw new Error(`Could not load /shiftedtone-source.zip (HTTP ${res.status})`);
      const buf = await res.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const zipB64 = btoa(binary);

      setResult(`Zip loaded (${Math.round(bytes.length / 1024)} KB). Pushing to GitHub…`);
      const out = await publish({ token: trimmed, zipB64 });
      setStatus("ok");
      setResult(
        out.alreadyUpToDate
          ? `Already up to date (nothing to commit).`
          : `Committed ${out.filesPushed} files (${out.filesDeleted} stale removed) — ${out.commit.slice(0, 7)}`,
      );
    } catch (err) {
      setStatus("error");
      setResult(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-5 border-3 border-ink bg-card p-8 shadow-[8px_8px_0_0_var(--color-ink)]">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-ink bg-sun">
            <Github className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Push source to GitHub</h1>
            <p className="text-sm text-muted-foreground">megsworkresources-cmd/ShiftedTone → main</p>
          </div>
        </div>

        <ol className="space-y-1 rounded-md border-2 border-ink/15 bg-background p-4 text-sm text-muted-foreground">
          <li>
            1. Create a fine-grained token: repo{" "}
            <span className="font-mono text-ink">megsworkresources-cmd/ShiftedTone</span>, permission{" "}
            <span className="font-mono text-ink">Contents: Read and write</span>.
          </li>
          <li>2. Paste it below and press Push. It is used once and never stored.</li>
          <li>3. Revoke the token on GitHub when the push lands.</li>
        </ol>

        <div className="space-y-2">
          <label htmlFor="gh-token" className="text-sm font-bold">
            GitHub fine-grained token
          </label>
          <input
            id="gh-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_…"
            className="w-full rounded-md border-2 border-ink bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-sun"
          />
          {tokenError && <p className="text-sm font-semibold text-coral">{tokenError}</p>}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={status === "working"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border-3 border-ink bg-sun px-4 py-3 text-base font-extrabold shadow-[4px_4px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {status === "working" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Pushing…
            </>
          ) : (
            <>
              <Github className="h-5 w-5" /> Push to main
            </>
          )}
        </button>

        {result && (
          <div
            className={
              "flex items-start gap-2 rounded-md border-2 p-4 text-sm font-semibold " +
              (status === "ok"
                ? "border-ink bg-mint/40"
                : status === "error"
                  ? "border-ink bg-coral/20"
                  : "border-ink/20 bg-background")
            }
          >
            {status === "ok" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            {status === "error" && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <div className="min-w-0 break-words">
              {result}
              {status === "ok" && !result.includes("up to date") && (
                <a
                  className="ml-2 underline"
                  href="https://github.com/megsworkresources-cmd/ShiftedTone/commits/main"
                  target="_blank"
                  rel="noreferrer"
                >
                  View commit ↗
                </a>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          After the push, redeploy on Vercel (build cache off) — or let the repo-connected deploy
          trigger automatically.
        </p>
      </div>
    </div>
  );
}
