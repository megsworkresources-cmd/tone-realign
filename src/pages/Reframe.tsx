import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { REFRAME_SCENARIOS } from "@/lib/drills";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Dices, Loader2, Shuffle } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function Reframe() {
  const [trigger, setTrigger] = useState("");
  const [reaction, setReaction] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<{
    reframe: string;
    toneNote: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reframeAction = useAction(api.ai.reframe);
  const saveReframe = useMutation(api.reframes.save);

  const randomScenario = () => {
    const pick =
      REFRAME_SCENARIOS[Math.floor(Math.random() * REFRAME_SCENARIOS.length)];
    setTrigger(pick);
  };

  const coach = async () => {
    if (!trigger.trim() || !reaction.trim()) {
      setError("Fill in both the trigger and your automatic reaction.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await reframeAction({
        trigger,
        reaction,
        goal: goal || undefined,
      });
      setResult(res);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The coach couldn't respond. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await saveReframe({
        trigger,
        reaction,
        goal: goal || undefined,
        reframe: result.reframe,
        toneNote: result.toneNote,
      });
      toast.success("Reframe saved to your log");
      setSaved(true);
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="nb-dots min-h-screen bg-paper px-4 pb-16 pt-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard">
            <NBButton variant="paper" className="px-3 py-2">
              <ArrowLeft className="size-4" /> Dashboard
            </NBButton>
          </Link>
          <NBBadge className="bg-mint">REFRAME LAB</NBBadge>
        </div>

        <NBPanel className="p-6">
          <h1 className="font-display text-2xl">Reprogram the response</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            The trigger fires. The automatic reaction comes out. Catch it here,
            and practice what you'd rather say instead.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest">
                  The trigger
                </label>
                <button
                  onClick={randomScenario}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-ink"
                >
                  <Dices className="size-3.5" /> Random
                </button>
              </div>
              <textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="What happened? What did they say or do?"
                className="nb w-full bg-card p-3 text-sm outline-none placeholder:text-muted-foreground"
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest">
                Your automatic reaction
              </label>
              <textarea
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                placeholder="What would you blurt out, or swallow? Be honest — nobody sees this."
                className="nb w-full bg-card p-3 text-sm outline-none placeholder:text-muted-foreground"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest">
                Your goal (optional)
              </label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. stay calm, hold the boundary, repair the moment"
                className="nb w-full bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <p className="nb bg-coral px-3 py-2 text-sm font-medium">{error}</p>
            )}

            <div>
              <NBButton onClick={coach} disabled={loading} variant="sun">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Coaching…
                  </>
                ) : (
                  <>
                    <Shuffle className="size-4" /> Reframe it
                  </>
                )}
              </NBButton>
            </div>
          </div>
        </NBPanel>

        {result && (
          <NBPanel className="p-6">
            <div className="flex items-center justify-between">
              <NBBadge className="bg-sun">COACHED RESPONSE</NBBadge>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Say it like this
              </span>
            </div>
            <p className="mt-4 text-lg font-medium leading-relaxed">
              “{result.reframe}”
            </p>
            <div className="mt-4 nb bg-mint p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Delivery note
              </p>
              <p className="mt-1 text-sm">{result.toneNote}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <NBButton variant="mint" disabled={saving || saved} onClick={handleSave}>
                {saved ? "Saved" : saving ? "Saving…" : "Save to log"}
              </NBButton>
              <NBButton
                variant="paper"
                onClick={() => {
                  setResult(null);
                  setReaction("");
                  setSaved(false);
                }}
              >
                Another one
              </NBButton>
            </div>
          </NBPanel>
        )}
      </div>
    </main>
  );
}
