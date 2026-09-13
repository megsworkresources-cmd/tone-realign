import { describe, expect, test } from "bun:test";
import { DRILLS, getDrill, REFRAME_SCENARIOS } from "./drills";
import { DAILY_ANGLES, getDailyChallenge } from "./daily";

describe("drill catalog curation", () => {
  test("catalog has the five curated drills in stable order", () => {
    expect(DRILLS.map((d) => d.id)).toEqual([
      "steady-ground",
      "warm-open",
      "nice-no",
      "unruffled",
      "firm-clear",
    ]);
  });

  test("every drill is complete: prompt, focus, tips, timing, theme color", () => {
    for (const d of DRILLS) {
      expect(d.name.length).toBeGreaterThan(3);
      expect(d.tag.length).toBeGreaterThan(3);
      expect(d.prompt.length).toBeGreaterThan(20);
      expect(d.focus.length).toBeGreaterThan(10);
      expect(d.tips.length).toBeGreaterThanOrEqual(3);
      for (const tip of d.tips) {
        expect(tip.length).toBeGreaterThan(5);
      }
      expect(d.seconds).toBeGreaterThanOrEqual(15);
      expect(d.seconds).toBeLessThanOrEqual(90);
      expect(d.color).toMatch(/^bg-(sun|mint|coral|paper|card|secondary)$/);
    }
  });

  test("drill ids are unique and resolvable via getDrill", () => {
    const ids = new Set(DRILLS.map((d) => d.id));
    expect(ids.size).toBe(DRILLS.length);
    for (const d of DRILLS) {
      expect(getDrill(d.id)).toBe(d);
    }
    expect(getDrill("nope-nope")).toBeUndefined();
  });

  test("reframe scenarios stay diverse and non-empty", () => {
    expect(REFRAME_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(REFRAME_SCENARIOS).size).toBe(REFRAME_SCENARIOS.length);
    for (const s of REFRAME_SCENARIOS) {
      expect(s.length).toBeGreaterThan(10);
    }
  });

  test("daily rotation stays valid against the grown catalog", () => {
    // The challenge card on the dashboard must resolve for every day.
    for (let d = 0; d < 120; d++) {
      const c = getDailyChallenge(d);
      expect(getDrill(c.drill.id)).toBeDefined();
      expect(DAILY_ANGLES).toContain(c.angle);
    }
  });
});
