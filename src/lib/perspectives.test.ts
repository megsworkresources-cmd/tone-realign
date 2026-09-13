import { describe, expect, test } from "bun:test";
import { LENSES, lensOfTheDay } from "./perspectives";

describe("perspective lenses", () => {
  test("five distinct lenses with complete, substantive copy", () => {
    expect(LENSES.length).toBe(5);
    const ids = LENSES.map((l) => l.id);
    expect(new Set(ids).size).toBe(5);
    for (const l of LENSES) {
      expect(l.name.length).toBeGreaterThan(3);
      expect(l.idea.length).toBeGreaterThan(30);
      expect(l.question.length).toBeGreaterThan(15);
      expect(l.seed.length).toBeGreaterThan(30);
      expect(l.color).toMatch(/^bg-(sun|mint|coral|paper|card|secondary)$/);
    }
  });

  test("every lens ends in a question (it's a lens, not a lecture)", () => {
    for (const l of LENSES) {
      expect(l.question.trim().endsWith("?")).toBe(true);
    }
  });

  test("lens of the day is deterministic and rotates through all five", () => {
    expect(lensOfTheDay(12)).toBe(lensOfTheDay(12));
    const seen = new Set<string>();
    for (let d = 0; d < 25; d++) {
      seen.add(lensOfTheDay(d).id);
    }
    expect(seen.size).toBe(5);
  });
});
