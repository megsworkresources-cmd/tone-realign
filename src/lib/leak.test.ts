import { describe, expect, test } from "bun:test";
import { getDailyLeak, LEAKS } from "./leak";

describe("leak scenarios", () => {
  test("at least 5 scenarios, well-formed", () => {
    expect(LEAKS.length).toBeGreaterThanOrEqual(5);
    for (const s of LEAKS) {
      expect(s.words.length).toBeGreaterThan(0);
      expect(s.delivered.length).toBeGreaterThan(0);
      expect(s.options.length).toBe(3);
      expect(s.answer).toBeGreaterThanOrEqual(0);
      expect(s.answer).toBeLessThan(3);
      for (const o of s.options) expect(o.note.length).toBeGreaterThan(0);
    }
  });

  test("the correct answer always names the leak; distractors don't repeat its core", () => {
    for (const s of LEAKS) {
      const answer = s.options[s.answer];
      expect(answer.text.length).toBeGreaterThan(0);
      const others = s.options.filter((_, i) => i !== s.answer);
      for (const o of others) {
        // Distractors must not be trivially identical to the answer.
        expect(o.text).not.toBe(answer.text);
      }
    }
  });

  test("daily picker is stable and cycles", () => {
    expect(getDailyLeak(2)).toBe(getDailyLeak(2));
    expect(getDailyLeak(0)).toBe(LEAKS[0]);
  });
});
