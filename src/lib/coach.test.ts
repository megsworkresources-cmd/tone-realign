import { describe, expect, test } from "bun:test";
import {
  buildCoachUserContent,
  fallbackCoachNote,
  pickWeakestSignal,
  sanitizeCoachText,
  validateCoachReply,
  type CoachTakeInput,
} from "./coach";

function takeInput(overrides: Partial<CoachTakeInput> = {}): CoachTakeInput {
  return {
    drillName: "Firm & Clear",
    focus: "Firm isn't loud. No apologetic tail.",
    durationSec: 34,
    dominantTone: "rushed",
    overallScore: 58,
    calmScore: 55,
    energyScore: 70,
    clarityScore: 61,
    stabilityScore: 64,
    avgPitchHz: 142,
    pitchRangeHz: 32,
    wordsPerMinute: 188,
    voicedRatio: 0.61,
    volumeVariability: 0.07,
    ...overrides,
  };
}

describe("sanitizeCoachText", () => {
  test("strips markdown, collapses whitespace, trims wrapping quotes", () => {
    expect(sanitizeCoachText('  **"Your pace *spiked*."**  ')).toBe("Your pace spiked.");
  });

  test("caps runaway replies with an ellipsis", () => {
    const out = sanitizeCoachText("a".repeat(600), 100);
    expect(out.length).toBe(100);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("validateCoachReply", () => {
  test("accepts a strict-JSON reply and sanitizes both fields", () => {
    const raw =
      '```json\n{"feedback": "Your pace hit 188 wpm — the tempo argued, not the words. Take the last sentence at 150.", "oneThing": " Last sentence at 150 wpm "}\n```';
    const reply = validateCoachReply(raw);
    expect(reply).not.toBeNull();
    expect(reply!.feedback.startsWith("Your pace hit 188 wpm")).toBe(true);
    expect(reply!.oneThing).toBe("Last sentence at 150 wpm");
  });

  test("returns null for prose without a JSON object", () => {
    expect(validateCoachReply("I hear you, and that's valid!")).toBeNull();
  });

  test("returns null when feedback is missing or too short to be specific", () => {
    expect(validateCoachReply('{"feedback": "Nice.", "oneThing": "x"}')).toBeNull();
    expect(validateCoachReply('{"oneThing": "slow down"}')).toBeNull();
  });

  test("returns null for malformed JSON", () => {
    expect(validateCoachReply('{"feedback": "unclosed')).toBeNull();
  });
});

describe("buildCoachUserContent", () => {
  test("includes the user's real numbers and drill focus", () => {
    const content = buildCoachUserContent(takeInput());
    expect(content).toContain("188 wpm");
    expect(content).toContain("142 Hz avg");
    expect(content).toContain("overall 58");
    expect(content).toContain("Firm isn't loud");
  });

  test("says when there is no transcript instead of sending an empty quote", () => {
    const without = buildCoachUserContent(takeInput());
    expect(without).toContain("No transcript");
    const withTranscript = buildCoachUserContent(
      takeInput({ transcript: "That doesn't work for me. Here's what I can do instead." }),
    );
    expect(withTranscript).toContain("What they said:");
    expect(withTranscript).toContain("Here's what I can do instead");
  });
});

describe("pickWeakestSignal", () => {
  test("rushed pace wins first", () => {
    expect(pickWeakestSignal(takeInput({ wordsPerMinute: 180 }))).toBe("pace");
  });

  test("flat pitch range wins when pace is sane", () => {
    expect(
      pickWeakestSignal(takeInput({ wordsPerMinute: 130, pitchRangeHz: 14 })),
    ).toBe("pitch range");
  });

  test("otherwise the lowest score carries", () => {
    expect(
      pickWeakestSignal(
        takeInput({
          wordsPerMinute: 130,
          pitchRangeHz: 60,
          clarityScore: 90,
          calmScore: 88,
          energyScore: 40,
          stabilityScore: 85,
        }),
      ),
    ).toBe("energy");
  });
});

describe("fallbackCoachNote", () => {
  test("the pace fallback cites the user's actual wpm and suggests a concrete target", () => {
    const note = fallbackCoachNote(takeInput({ wordsPerMinute: 188 }));
    expect(note.feedback).toContain("188 wpm");
    expect(note.feedback).toContain("150");
    expect(note.oneThing.length).toBeGreaterThan(0);
  });

  test("the flatness fallback cites the user's actual Hz range", () => {
    const note = fallbackCoachNote(
      takeInput({ wordsPerMinute: 128, pitchRangeHz: 12, dominantTone: "flat" }),
    );
    expect(note.feedback).toContain("12 Hz");
  });

  test("every fallback stays short — feedback is 2-3 sentences, no therapy-speak", () => {
    const samples = [
      takeInput({ dominantTone: "tense", stabilityScore: 31 }),
      takeInput({ dominantTone: "flat", pitchRangeHz: 10 }),
      takeInput({ dominantTone: "rushed", calmScore: 40, clarityScore: 80, energyScore: 82 }),
    ];
    for (const t of samples) {
      const note = fallbackCoachNote(t);
      const sentences = note.feedback.split(/[.!?]\s/).length;
      expect(sentences).toBeLessThanOrEqual(4);
      const lowered = note.feedback.toLowerCase();
      expect(lowered).not.toContain("i hear you");
      expect(lowered).not.toContain("that's valid");
      expect(lowered).not.toContain("amazing");
      expect(note.feedback.length).toBeLessThan(420);
    }
  });
});
