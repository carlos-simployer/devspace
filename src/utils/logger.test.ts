import { describe, it, expect, beforeEach } from "vitest";
import { info, warn, error, getLogEntries, clearLog } from "./logger.ts";

beforeEach(() => {
  clearLog();
});

describe("logger", () => {
  it("stores log entries in order", () => {
    info("auth", "token resolved");
    warn("cache", "cache miss");
    error("api", "request failed");

    const entries = getLogEntries();
    expect(entries).toHaveLength(3);
    expect(entries[0]!.level).toBe("info");
    expect(entries[0]!.category).toBe("auth");
    expect(entries[0]!.message).toBe("token resolved");
    expect(entries[1]!.level).toBe("warn");
    expect(entries[2]!.level).toBe("error");
  });

  it("clears all entries", () => {
    info("test", "one");
    info("test", "two");
    expect(getLogEntries()).toHaveLength(2);

    clearLog();
    expect(getLogEntries()).toHaveLength(0);
  });

  it("timestamps entries", () => {
    const before = Date.now();
    info("test", "timed");
    const after = Date.now();

    const entry = getLogEntries()[0]!;
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
  });
});
