import { describe, expect, test } from "bun:test";
import {
  MAX_TAKE_AUDIO_BYTES,
  isAllowedTakeAudioMime,
  isTakeAudioSizeOk,
  normalizeMimeType,
  pickTakeAudioMime,
} from "./take-audio";

describe("normalizeMimeType", () => {
  test("strips codecs and lowercases", () => {
    expect(normalizeMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(normalizeMimeType("AUDIO/MP4")).toBe("audio/mp4");
  });
});

describe("isAllowedTakeAudioMime", () => {
  test("accepts the real recorder containers", () => {
    expect(isAllowedTakeAudioMime("audio/webm;codecs=opus")).toBe(true);
    expect(isAllowedTakeAudioMime("audio/mp4")).toBe(true);
    expect(isAllowedTakeAudioMime("audio/ogg;codecs=opus")).toBe(true);
  });

  test("rejects non-audio uploads", () => {
    expect(isAllowedTakeAudioMime("video/webm;codecs=vp8")).toBe(false);
    expect(isAllowedTakeAudioMime("application/pdf")).toBe(false);
    expect(isAllowedTakeAudioMime("")).toBe(false);
  });
});

describe("isTakeAudioSizeOk", () => {
  test("accepts plausible sizes up to the cap", () => {
    expect(isTakeAudioSizeOk(1)).toBe(true);
    expect(isTakeAudioSizeOk(MAX_TAKE_AUDIO_BYTES)).toBe(true);
  });

  test("rejects empty and oversized blobs", () => {
    expect(isTakeAudioSizeOk(0)).toBe(false);
    expect(isTakeAudioSizeOk(MAX_TAKE_AUDIO_BYTES + 1)).toBe(false);
    expect(isTakeAudioSizeOk(Number.NaN)).toBe(false);
  });
});

describe("pickTakeAudioMime", () => {
  test("returns a supported mime or null (never throws)", () => {
    const mime = pickTakeAudioMime();
    if (mime === null) return;
    expect(mime.startsWith("audio/")).toBe(true);
  });
});
