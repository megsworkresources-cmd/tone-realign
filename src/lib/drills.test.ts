import { describe, expect, test } from "bun:test";
import { DRILLS, DRILL_GROUPS, drillsInGroup, getDrill, REFRAME_SCENARIOS } from "./drills";
import { DAILY_ANGLES, getDailyChallenge } from "./daily";

describe("drill catalog curation", () => {
  test("catalog has the eight curated drills in stable order", () => {
    expect(DRILLS.map((d) => d.id)).toEqual([
      "steady-ground",
      "warm-open",
      "nice-no",
      "unruffled",
      "firm-clear",
      "de-escalate",
      "praise-clear",
      "recovery",
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

describe("drill groups", () => {
  test("every drill belongs to exactly one group — no orphans, no doubles", () => {
    const grouped = DRILL_GROUPS.flatMap((g) => g.drillIds);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...DRILLS.map((d) => d.id)].sort());
  });

  test("each group resolves to real drills in catalog order", () => {
    for (const g of DRILL_GROUPS) {
      const drills = drillsInGroup(g.id);
      expect(drills.map((d) => d.id)).toEqual(g.drillIds);
      for (const d of drills) {
        expect(d.prompt.length).toBeGreaterThan(0);
      }
    }
  });

  test("groups are small enough to fit one screen — that's the point", () => {
    for (const g of DRILL_GROUPS) {
      expect(g.drillIds.length).toBeLessThanOrEqual(3);
      expect(g.blurb.length).toBeGreaterThan(0);
    }
    expect(DRILL_GROUPS.length).toBeGreaterThanOrEqual(2);
  });

  test("unknown group id yields an empty list (Gym falls back to group 0)", () => {
    expect(drillsInGroup("nope")).toEqual([]);
  });
});
