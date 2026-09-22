import { Link } from "react-router";

/**
 * Preview-only shortcut to the one-shot ops page (/push-source). Renders
 * nothing on production hosts — mirroring the gate inside PushSource itself,
 * so the ops surface can never ship live by accident (see LAUNCH.md §5).
 */
export function OpsLink() {
  const isProdHost =
    typeof window !== "undefined" &&
    !/localhost|127\.0\.0\.1|\.vly\.|\.preview\./i.test(window.location.hostname);
  if (isProdHost) return null;

  return (
    <Link
      to="/push-source"
      aria-label="Open the source-push ops page (preview only)"
      className="nb fixed bottom-2 left-2 z-50 bg-paper px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
    >
      ops
    </Link>
  );
}
