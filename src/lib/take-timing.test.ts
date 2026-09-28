import { describe, expect, test } from "bun:test";
import {
  COUNTDOWN_SECONDS,
  PACE_BAR_CLASS,
  PACE_HINTS,
  TRANSLATE_TAKE_TARGET_MS,
  countdownBeats,
  formatClock,
  pacePct,
  paceStatus,
} from "./take-timing";

describe("countdown beats", () => {
  test("counts down from COUNTDOWN_SECONDS to 1", () => {
    expect(countdownBeats()).toEqual([3, 2, 1]);
    expect(countdownBeats().length).toBe(COUNTDOWN_SECONDS);
  });
});

describe("formatClock", () => {
  test("renders the recorder's M:SS clock", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(3_400)).toBe("0:03");
    expect(formatClock(59_900)).toBe("0:59");
    expect(formatClock(60_000)).toBe("1:00");
    expect(formatClock(75_200)).toBe("1:15");
  });

  test("truncates rather than rounds sub-second time", () => {
    expect(formatClock(999)).toBe("0:00");
    expect(formatClock(61_999)).toBe("1:01");
  });
});

describe("TRANSLATE_TAKE_TARGET_MS", () => {
  test("fits one deliberate sentence inside the pace thresholds", () => {
    // A target the pace bar can actually move through: reachable,
    // with room for the "good-length" and "overtime" bands to matter.
    expect(TRANSLATE_TAKE_TARGET_MS).toBeGreaterThan(5_000);
    expect(TRANSLATE_TAKE_TARGET_MS).toBeLessThanOrEqual(30_000);
  });
});

describe("paceStatus", () => {
  const target = 45_000;

  test("warming-up before a third of the target", () => {
    expect(paceStatus(0, target)).toBe("warming-up");
    expect(paceStatus(target / 3 - 1, target)).toBe("warming-up");
  });

  test("on-pace inside the target window", () => {
    expect(paceStatus(target / 3, target)).toBe("on-pace");
    expect(paceStatus(target - 1, target)).toBe("on-pace");
  });

  test("good-length right after the target", () => {
    expect(paceStatus(target, target)).toBe("good-length");
    expect(paceStatus(target * 1.49, target)).toBe("good-length");
  });

  test("overtime well past the target", () => {
    expect(paceStatus(target * 1.5, target)).toBe("overtime");
    expect(paceStatus(target * 4, target)).toBe("overtime");
  });

  test("zero/negative target is safe (stays on-pace)", () => {
    expect(paceStatus(10_000, 0)).toBe("on-pace");
    expect(paceStatus(10_000, -1)).toBe("on-pace");
  });
});

describe("pacePct", () => {
  test("fills linearly and caps at 100", () => {
    expect(pacePct(0, 45_000)).toBe(0);
    expect(pacePct(22_500, 45_000)).toBe(50);
    expect(pacePct(45_000, 45_000)).toBe(100);
    expect(pacePct(90_000, 45_000)).toBe(100);
  });

  test("zero target stays at 0", () => {
    expect(pacePct(10_000, 0)).toBe(0);
  });
});

describe("pace copy covers every status", () => {
  const statuses = ["warming-up", "on-pace", "good-length", "overtime"] as const;
  test("hint + bar class exist for each", () => {
    for (const s of statuses) {
      expect(PACE_HINTS[s].length).toBeGreaterThan(5);
      expect(PACE_BAR_CLASS[s]).toMatch(/^bg-/);
    }
  });
});
