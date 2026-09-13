import { describe, expect, test } from "bun:test";
import { QUIZ, getDailyQuestion } from "./quiz";

describe("quiz curation", () => {
  test("every question has exactly three options and a valid best index", () => {
    for (const q of QUIZ) {
      expect(q.options.length).toBe(3);
      expect(q.best).toBeGreaterThanOrEqual(0);
      expect(q.best).toBeLessThan(q.options.length);
    }
  });

  test("every option carries a real note (no empty coaching)", () => {
    for (const q of QUIZ) {
      for (const opt of q.options) {
        expect(opt.text.length).toBeGreaterThan(5);
        expect(opt.note.length).toBeGreaterThan(20);
      }
    }
  });

  test("questions are unique by id", () => {
    const ids = new Set(QUIZ.map((q) => q.id));
    expect(ids.size).toBe(QUIZ.length);
  });
});

describe("getDailyQuestion", () => {
  test("same day, same question — different day, cycles", () => {
    expect(getDailyQuestion(3)).toBe(getDailyQuestion(3));
    expect(getDailyQuestion(0)).not.toBe(getDailyQuestion(1));
  });

  test("wraps cleanly at the end of the set", () => {
    expect(getDailyQuestion(QUIZ.length)).toBe(QUIZ[0]);
  });
});
