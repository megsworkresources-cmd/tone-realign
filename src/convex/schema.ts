import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // One completed tone practice take (microphone session)
    practiceSessions: defineTable({
      userId: v.id("users"),
      drill: v.string(), // e.g. "steady-ground" | "warm-open" | "firm-clear"
      scenario: v.optional(v.string()), // free-text context the user typed
      durationMs: v.number(),
      // Aggregate scores 0..100 from the client-side audio analysis
      calmScore: v.number(),
      energyScore: v.number(),
      clarityScore: v.number(),
      stabilityScore: v.number(),
      overallScore: v.number(),
      // Raw metrics
      avgPitchHz: v.number(),
      pitchRangeHz: v.number(),
      avgVolume: v.number(),
      volumeVariability: v.number(),
      wordsPerMinute: v.number(),
      voicedRatio: v.number(),
      dominantTone: v.string(), // "calm" | "energetic" | "tense" | "flat" | "mixed"
    }).index("by_user", ["userId"]),

    // A triggered-response reframe exercise
    reframeLogs: defineTable({
      userId: v.id("users"),
      trigger: v.string(), // the situation / other person's words
      reaction: v.string(), // the user's automatic response
      goal: v.optional(v.string()), // desired outcome, e.g. "stay calm"
      reframe: v.optional(v.string()), // AI-coached alternative response
      toneNote: v.optional(v.string()), // how to say it
    }).index("by_user", ["userId"]),

    // Which drills the user has practiced and how many times
    drillAttempts: defineTable({
      userId: v.id("users"),
      drill: v.string(),
      bestScore: v.number(),
      attemptCount: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_drill", ["userId", "drill"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
