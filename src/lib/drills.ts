/** The drill catalog for tone practice. */

export interface Drill {
  id: string;
  name: string;
  tag: string;
  color: string; // tailwind bg class
  prompt: string; // what to actually say
  focus: string;
  tips: string[];
  seconds: number; // suggested take length
}

export const DRILLS: Drill[] = [
  {
    id: "steady-ground",
    name: "Steady Ground",
    tag: "CALM UNDER PRESSURE",
    color: "bg-sun",
    prompt:
      "Describe what happened this morning — factually, without complaint. Then say: \"I'd like to fix one thing about it.\"",
    focus: "Keep volume even. Let sentences land. No rush.",
    tips: [
      "Speak on the exhale, not the inhale",
      "Pause a full beat before \"I'd like to fix one thing\"",
      "If you speed up, stop and restart the sentence",
    ],
    seconds: 45,
  },
  {
    id: "warm-open",
    name: "Warm Open",
    tag: "WARMTH & PRESENCE",
    color: "bg-mint",
    prompt:
      "Greet someone you haven't seen in months. Tell them one thing you genuinely appreciate about them.",
    focus: "Let your pitch move. Smile audibly. Slow down on the person's name.",
    tips: [
      "Pitch rises slightly on genuine warmth — let it",
      "Say their name slowly",
      "End statements downward, not upward",
    ],
    seconds: 40,
  },
  {
    id: "nice-no",
    name: "The Kind No",
    tag: "SAYING NO",
    color: "bg-sun",
    prompt:
      "A friend asks you to help them move on your only day off. Say no, offer something small you can actually do, and don't apologize more than once.",
    focus: "Steady voice, level ending. The pause after your no is part of the answer.",
    tips: [
      "A no said warmly still lands as a no",
      "One apology, maximum — then move to the offer",
      "If you start justifying, you're negotiating with yourself",
    ],
    seconds: 40,
  },
  {
    id: "unruffled",
    name: "Un-Ruffled",
    tag: "TAKING THE HIT",
    color: "bg-mint",
    prompt:
      "Someone takes a light jab at you in front of others. Respond without matching their energy — acknowledge it, then raise the temperature back to normal.",
    focus: "Your job is to be the thermostat, not the thermometer. Notice the spike, drop your pace instead of raising your voice.",
    tips: [
      "Slow down exactly when you feel the urge to speed up",
      "A small smile changes your tone before it changes your face",
      "Lower your volume one notch below theirs",
    ],
    seconds: 30,
  },
  {
    id: "firm-clear",
    name: "Firm & Clear",
    tag: "BOUNDARIES",
    color: "bg-coral",
    prompt:
      "Say: \"That doesn't work for me. Here's what I can do instead.\" Then hold a pause for two seconds without filling it.",
    focus: "Firm isn't loud. Lower pitch, steady volume, no apologetic tail.",
    tips: [
      "Don't trail off at the end of the sentence",
      "The pause is part of the answer — don't fill it",
      "Keep volume below your urge to push",
    ],
    seconds: 35,
  },
  {
    id: "de-escalate",
    name: "Bring It Down",
    tag: "DE-ESCALATION",
    color: "bg-mint",
    prompt:
      "Someone is talking over you, louder and faster. Without matching their volume, say: \"I want to hear this — and I can only hear it one voice at a time.\" Then slow your next sentence to half speed.",
    focus:
      "Lower and slower is the whole move. Your calm is an offer, not a weapon — let the pace gap do the work.",
    tips: [
      "Drop your volume one notch below theirs and stay there",
      "Speak on the exhale — it physically can't sound sharp",
      "If they speed up, you slow down: the gap resets the room",
    ],
    seconds: 40,
  },
  {
    id: "praise-clear",
    name: "Name the Good",
    tag: "PRAISE THAT LANDS",
    color: "bg-sun",
    prompt:
      "Tell someone about one specific thing they did well this week — what they did, and what it made possible. Let the last sentence land before you stop.",
    focus:
      "Praise dies when it's mumbled or rushed. Fuller volume, slight pitch lift on the good part, unhurried ending.",
    tips: [
      "Specific beats general: name the exact thing they did",
      "Lift your pitch slightly on the strength you're naming",
      "Don't swallow the ending — let the last word finish",
    ],
    seconds: 35,
  },
  {
    id: "recovery",
    name: "The Clean Recovery",
    tag: "AFTER THE MISS",
    color: "bg-coral",
    prompt:
      "You just snapped at someone and you know it. Say: \"That came out sharper than I meant. Let me try that again.\" Then repeat your point, slower, at the tone you wanted the first time.",
    focus:
      "Recovery without groveling: name it in one short clause, then model the tone you meant. No self-flagellation.",
    tips: [
      "One clean clause, then move — don't relitigate",
      "The retake is the point: slower, lower, level ending",
      "Skip the apology spiral; it makes them manage you",
    ],
    seconds: 40,
  },
];

export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}

/** Scenario prompts for the trigger-reframe practice. */
export const REFRAME_SCENARIOS = [
  "Your boss emails \"we need to talk\" with no context.",
  "A friend cancels plans last minute for the third time.",
  "Someone takes credit for your idea in a meeting.",
  "Your partner sighs and says \"fine, whatever.\"",
  "A stranger cuts in line in front of you.",
  "You get critical feedback on something you worked hard on.",
];
