/**
 * Free-tier taste → paid coach. Pure entitlement logic so the gating is
 * testable without a database and can never drift between surfaces.
 *
 * The paid promise (per the V1 spec): feedback anchored to the user's own
 * numbers — the one thing a free generic tip bank can't do.
 */

export const FREE_COACH_NOTES = 3;

export interface CoachEntitlement {
  /** Can this user generate a note right now? */
  allowed: boolean;
  /** True when they've used their free taste and haven't unlocked the coach. */
  needsUpgrade: boolean;
  /** How many of the free notes remain. */
  freeRemaining: number;
}

export function coachEntitlement(args: {
  coachUnlocked: boolean;
  freeNotesUsed: number;
}): CoachEntitlement {
  if (args.coachUnlocked) {
    return { allowed: true, needsUpgrade: false, freeRemaining: 0 };
  }
  const freeRemaining = Math.max(FREE_COACH_NOTES - args.freeNotesUsed, 0);
  return {
    allowed: freeRemaining > 0,
    needsUpgrade: freeRemaining === 0,
    freeRemaining,
  };
}
