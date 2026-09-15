import { describe, expect, test } from "bun:test";
import {
  getDailyTranslation,
  passOrder,
  TRANSLATION_LINES,
} from "./translation";

describe("translation drill data", () => {
  test("at least 6 lines, each with all copy fields", () => {
    expect(TRANSLATION_LINES.length).toBeGreaterThanOrEqual(6);
    for (const line of TRANSLATION_LINES) {
      for (const field of ["text", "usually", "intended", "targetHint", "payoff"] as const) {
        expect(line[field].length).toBeGreaterThan(0);
      }
    }
  });

  test("ids unique", () => {
    expect(new Set(TRANSLATION_LINES.map((l) => l.id)).size).toBe(TRANSLATION_LINES.length);
  });

  test("daily picker is stable and cycles", () => {
    expect(getDailyTranslation(3)).toBe(getDailyTranslation(3));
    expect(getDailyTranslation(0)).toBe(TRANSLATION_LINES[0]);
    expect(getDailyTranslation(TRANSLATION_LINES.length)).toBe(TRANSLATION_LINES[0]);
  });

  test("pass order alternates and always contains both passes", () => {
    expect(passOrder(0)).toEqual(["reflex", "intended"]);
    expect(passOrder(1)).toEqual(["intended", "reflex"]);
    for (let day = 0; day < 10; day++) {
      expect(new Set(passOrder(day)).size).toBe(2);
    }
  });
});
