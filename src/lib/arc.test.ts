import { describe, expect, test } from "bun:test";
import { arcDaysLeft, arcStageFor, ARC_LENGTH, ARC_STAGES } from "./arc";

describe("21-day arc", () => {
  test("stages tile 1..21 with no gaps or overlaps", () => {
    const sorted = [...ARC_STAGES].sort((a, b) => a.from - b.from);
    expect(sorted[0].from).toBe(1);
    expect(sorted[sorted.length - 1].to).toBe(ARC_LENGTH);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].from).toBe(sorted[i - 1].to + 1);
    }
  });

  test("stage lookup is correct inside each range", () => {
    for (const stage of ARC_STAGES) {
      expect(arcStageFor(stage.from).id).toBe(stage.id);
      expect(arcStageFor(stage.to).id).toBe(stage.id);
    }
  });

  test("out-of-range days clamp", () => {
    expect(arcStageFor(0).id).toBe("floor");
    expect(arcStageFor(999).id).toBe("translate");
    expect(arcDaysLeft(999)).toBe(0);
    expect(arcDaysLeft(0)).toBe(ARC_LENGTH);
  });
});
