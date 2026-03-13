import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { relativeTime } from "./time.ts";

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Wednesday 2024-03-13 12:00:00 UTC
    vi.setSystemTime(new Date("2024-03-13T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('"now" for dates less than 1 minute ago', () => {
    it("returns now for 0 seconds ago", () => {
      const result = relativeTime("2024-03-13T12:00:00Z");
      expect(result).toEqual({ text: "now", isRecent: true });
    });

    it("returns now for 30 seconds ago", () => {
      const result = relativeTime("2024-03-13T11:59:30Z");
      expect(result).toEqual({ text: "now", isRecent: true });
    });

    it("returns now for 59 seconds ago", () => {
      const result = relativeTime("2024-03-13T11:59:01Z");
      expect(result).toEqual({ text: "now", isRecent: true });
    });
  });

  describe('"Xm" for dates 1-59 minutes ago', () => {
    it("returns 1m for exactly 1 minute ago", () => {
      const result = relativeTime("2024-03-13T11:59:00Z");
      expect(result).toEqual({ text: "1m", isRecent: true });
    });

    it("returns 5m for 5 minutes ago", () => {
      const result = relativeTime("2024-03-13T11:55:00Z");
      expect(result).toEqual({ text: "5m", isRecent: true });
    });

    it("returns 30m for 30 minutes ago", () => {
      const result = relativeTime("2024-03-13T11:30:00Z");
      expect(result).toEqual({ text: "30m", isRecent: true });
    });

    it("returns 59m for 59 minutes ago", () => {
      const result = relativeTime("2024-03-13T11:01:00Z");
      expect(result).toEqual({ text: "59m", isRecent: true });
    });
  });

  describe('"Xh" for dates 1-23 hours ago', () => {
    it("returns 1h for exactly 60 minutes ago", () => {
      const result = relativeTime("2024-03-13T11:00:00Z");
      expect(result).toEqual({ text: "1h", isRecent: false });
    });

    it("returns 1h for 90 minutes ago", () => {
      const result = relativeTime("2024-03-13T10:30:00Z");
      expect(result).toEqual({ text: "1h", isRecent: false });
    });

    it("returns 12h for 12 hours ago", () => {
      const result = relativeTime("2024-03-13T00:00:00Z");
      expect(result).toEqual({ text: "12h", isRecent: false });
    });

    it("returns 23h for 23 hours ago", () => {
      const result = relativeTime("2024-03-12T13:00:00Z");
      expect(result).toEqual({ text: "23h", isRecent: false });
    });
  });

  describe('"Xd" for dates 1+ days ago', () => {
    it("returns 1d for exactly 24 hours ago", () => {
      const result = relativeTime("2024-03-12T12:00:00Z");
      expect(result).toEqual({ text: "1d", isRecent: false });
    });

    it("returns 7d for 7 days ago", () => {
      const result = relativeTime("2024-03-06T12:00:00Z");
      expect(result).toEqual({ text: "7d", isRecent: false });
    });

    it("returns 30d for 30 days ago", () => {
      const result = relativeTime("2024-02-12T12:00:00Z");
      expect(result).toEqual({ text: "30d", isRecent: false });
    });
  });

  describe("boundary cases", () => {
    it("exactly 1 minute → 1m (not now)", () => {
      const result = relativeTime("2024-03-13T11:59:00Z");
      expect(result.text).toBe("1m");
      expect(result.isRecent).toBe(true);
    });

    it("exactly 60 minutes → 1h (not 60m)", () => {
      const result = relativeTime("2024-03-13T11:00:00Z");
      expect(result.text).toBe("1h");
      expect(result.isRecent).toBe(false);
    });

    it("exactly 24 hours → 1d (not 24h)", () => {
      const result = relativeTime("2024-03-12T12:00:00Z");
      expect(result.text).toBe("1d");
      expect(result.isRecent).toBe(false);
    });

    it("isRecent is true only when diffMin < 60", () => {
      // 59 minutes 59 seconds ago => diffMin = 59 => isRecent: true
      const recent = relativeTime("2024-03-13T11:00:01Z");
      expect(recent.isRecent).toBe(true);

      // 60 minutes ago => diffMin = 60 => isRecent: false
      const notRecent = relativeTime("2024-03-13T11:00:00Z");
      expect(notRecent.isRecent).toBe(false);
    });
  });
});
