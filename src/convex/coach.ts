"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { vly } from "../lib/vly-integrations";
import type { CoachEntitlement } from "../lib/entitlements";
import {
  buildCoachUserContent,
  COACH_SYSTEM_PROMPT,
  fallbackCoachNote,
  validateCoachReply,
  type CoachReply,
  type CoachTakeInput,
} from "../lib/coach";

/**
 * The V1 reframe coach — the paywall floor.
 *
 * Input: the user's saved take (their real pitch/pace/pressure/stability
 * numbers, plus an optional Web Speech transcript and their stated goal).
 * Output: 2-3 sentences of feedback citing THEIR numbers + one micro-suggestion.
 *
 * The value is the anchoring — a free tip bank can't know their pace hit
 * 188 wpm. Fails closed: if the LLM errors or returns garbage, the take still
 * gets a deterministic note built from their actual metrics (source: fallback).
 */

// Explicit payload types keep TypeScript out of inference cycles across the
// generated API (runQuery results referenced inside an exported action's
// inferred return type).
interface CoachAccessPayload {
  entitlement: CoachEntitlement;
  hasAnyNotes: boolean;
}

interface CoachSessionPayload {
  userId: Id<"users">;
  drill: string;
  drillName: string;
  focus: string;
  durationMs: number;
  dominantTone: string;
  overallScore: number;
  calmScore: number;
  energyScore: number;
  clarityScore: number;
  stabilityScore: number;
  avgPitchHz: number;
  pitchRangeHz: number;
  wordsPerMinute: number;
  voicedRatio: number;
  volumeVariability: number;
  transcript?: string;
}

export const generate = action({
  args: {
    sessionId: v.id("practiceSessions"),
    goal: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, goal }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Entitlement gate — free taste counter, then paid.
    const access = (await ctx.runQuery(api.coachNotes.checkAccess, {})) as
      | CoachAccessPayload
      | null;
    if (!access) throw new Error("Not authenticated");
    if (access.entitlement.needsUpgrade) {
      throw new Error("Free coach notes are used up. Unlock the coach to keep going.");
    }

    // 2. Load their take (ownership-checked) and their best on this drill.
    const session = (await ctx.runQuery(internal.sessions.getSessionForCoach, {
      sessionId,
    })) as CoachSessionPayload | null;
    if (!session) throw new Error("Take not found");

    const best = (await ctx.runQuery(internal.sessions.getDrillBest, {
      userId: session.userId,
      drill: session.drill,
    })) as number | null;
    // Convex serializes absent values as null across runQuery boundaries.
    const previousBest = best === null ? undefined : best;

    const takeInput: CoachTakeInput = {
      drillName: session.drillName,
      focus: session.focus,
      durationSec: session.durationMs / 1000,
      dominantTone: session.dominantTone,
      overallScore: session.overallScore,
      calmScore: session.calmScore,
      energyScore: session.energyScore,
      clarityScore: session.clarityScore,
      stabilityScore: session.stabilityScore,
      avgPitchHz: session.avgPitchHz,
      pitchRangeHz: session.pitchRangeHz,
      wordsPerMinute: session.wordsPerMinute,
      voicedRatio: session.voicedRatio,
      volumeVariability: session.volumeVariability,
      transcript: session.transcript,
      goal,
      previousBest,
    };

    // 3. Guard: one note per take.
    await ctx.runMutation(internal.coachNotes.reserveForSession, { sessionId });

    // 4. LLM call — cheap, single completion, ~160 output tokens.
    let reply: CoachReply | null = null;
    let source = "fallback";
    try {
      const result = await vly.ai.completion({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: COACH_SYSTEM_PROMPT },
          { role: "user", content: buildCoachUserContent(takeInput) },
        ],
        temperature: 0.6,
        maxTokens: 160,
      });
      const raw = result?.data?.choices?.[0]?.message?.content ?? "";
      reply = validateCoachReply(raw);
      if (reply) source = "llm";
    } catch {
      reply = null;
    }

    // 5. Fails closed to a number-anchored fallback, never a dead button.
    if (!reply) {
      reply = fallbackCoachNote(takeInput);
      source = "fallback";
    }

    // 6. Persist and return.
    await ctx.runMutation(internal.coachNotes.store, {
      sessionId,
      feedback: reply.feedback,
      oneThing: reply.oneThing,
      source,
    });

    return {
      feedback: reply.feedback,
      oneThing: reply.oneThing,
      source,
      freeRemaining: Math.max(access.entitlement.freeRemaining - 1, 0),
    };
  },
});
