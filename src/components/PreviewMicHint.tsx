import { useState } from "react";
import { NBButton } from "@/components/nb";
import { isEmbeddedFrame } from "@/hooks/use-tone-capture";
import { ExternalLink, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";

/** Session flag so dismissing the hint survives page navigation. */
const DISMISS_KEY = "st-preview-mic-hint-dismissed";

/**
 * Proactive notice for embedded preview frames (the Freebuff preview pane).
 *
 * Browsers refuse the microphone inside an iframe unless the embedding page
 * opts in — the permission prompt never even appears, which reads like a bug.
 * MicError handles this reactively after a failed take; this banner says so
 * up front, before anyone presses record. Outside a preview frame it renders
 * nothing at all, so production users never see it.
 */
export function PreviewMicHint({ className }: { className?: string }) {
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(DISMISS_KEY) === "1",
  );

  // Outside a preview frame (or already dismissed this session) there is
  // nothing to say — the mic behaves normally there.
  if (!isEmbeddedFrame || dismissed) return null;

  return (
    <div
      className={cn("nb nb-shadow-sm bg-sun px-3 py-2.5 text-left", className)}
      role="note"
    >
      <div className="flex items-start gap-2">
        <MonitorPlay className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest">
            This is the preview
          </p>
          <p className="mt-1 text-sm leading-snug">
            Browsers block the microphone inside previews — the permission
            prompt can't even appear here. Open the app in a full browser tab
            to record takes and hear them back. Everything works there.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <NBButton
              variant="ink"
              className="px-3 py-1.5 text-xs"
              onClick={() =>
                window.open(window.location.href, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="size-3.5" /> Open in a new tab
            </NBButton>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.setItem(DISMISS_KEY, "1");
                } catch {
                  // Private-browsing storage can refuse; dismissal still works.
                }
                setDismissed(true);
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-ink/60 transition-colors hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
