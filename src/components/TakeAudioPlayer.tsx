import { useQuery } from "convex/react";
import { AudioLines, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Listen-back player for one saved take. Fetches the owner-only audio URL
 * (the query returns null when the take has no audio) and renders a plain
 * native audio element in the app's bordered style. Takes saved before
 * this feature simply show the quiet "no recording" fallback.
 */
export function TakeAudioPlayer({
  sessionId,
}: {
  sessionId: Id<"practiceSessions">;
}) {
  const url = useQuery(api.sessions.takeAudioUrl, { sessionId });

  if (url === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking for your recording…
      </div>
    );
  }

  if (url === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AudioLines className="size-4" />
        <span>
          No recording for this take — it was saved before listen-back, or the
          browser couldn't capture audio. New takes record automatically.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <AudioLines className="size-4" /> Listen back
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- voice takes have no captions */}
      <audio
        controls
        preload="none"
        src={url}
        className="nb w-full bg-card"
        aria-label="Your recorded take"
      />
    </div>
  );
}
