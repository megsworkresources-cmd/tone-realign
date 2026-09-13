import { describe, expect, test } from "bun:test";
import { FREE_COACH_NOTES, coachEntitlement } from "./entitlements";

describe("coachEntitlement", () => {
  test("unlocked users are always allowed", () => {
    const e = coachEntitlement({ coachUnlocked: true, freeNotesUsed: 99 });
    expect(e.allowed).toBe(true);
    expect(e.needsUpgrade).toBe(false);
  });

  test(`free users get exactly ${FREE_COACH_NOTES} tastes`, () => {
    const fresh = coachEntitlement({ coachUnlocked: false, freeNotesUsed: 0 });
    expect(fresh.allowed).toBe(true);
    expect(fresh.freeRemaining).toBe(FREE_COACH_NOTES);

    const mid = coachEntitlement({ coachUnlocked: false, freeNotesUsed: 2 });
    expect(mid.allowed).toBe(true);
    expect(mid.freeRemaining).toBe(1);

    const spent = coachEntitlement({ coachUnlocked: false, freeNotesUsed: FREE_COACH_NOTES });
    expect(spent.allowed).toBe(false);
    expect(spent.needsUpgrade).toBe(true);
    expect(spent.freeRemaining).toBe(0);
  });

  test("over-use can never go negative", () => {
    const e = coachEntitlement({ coachUnlocked: false, freeNotesUsed: 1000 });
    expect(e.freeRemaining).toBe(0);
    expect(e.needsUpgrade).toBe(true);
  });
});
