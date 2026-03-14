import { describe, it, expect } from "vitest";
import {
  formatBranch,
  formatDuration,
  getBuildReasonLabel,
} from "./azure-status.ts";

describe("formatBranch", () => {
  it("strips refs/heads/ prefix", () => {
    expect(formatBranch("refs/heads/main")).toBe("main");
    expect(formatBranch("refs/heads/feature/foo")).toBe("feature/foo");
  });

  it("converts refs/pull/ to PR #", () => {
    expect(formatBranch("refs/pull/123/merge")).toBe("PR #123");
  });

  it("returns as-is for unknown format", () => {
    expect(formatBranch("some-branch")).toBe("some-branch");
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration("2026-01-01T10:00:00Z", "2026-01-01T10:02:34Z")).toBe(
      "2m 34s",
    );
  });

  it("formats seconds only when under a minute", () => {
    expect(formatDuration("2026-01-01T10:00:00Z", "2026-01-01T10:00:12Z")).toBe(
      "12s",
    );
  });

  it("returns empty string for null inputs", () => {
    expect(formatDuration(null, null)).toBe("");
    expect(formatDuration("2026-01-01T10:00:00Z", null)).toBe("");
  });
});

describe("getBuildReasonLabel", () => {
  it("maps known reasons", () => {
    expect(getBuildReasonLabel("manual")).toBe("Manual");
    expect(getBuildReasonLabel("individualCI")).toBe("CI");
    expect(getBuildReasonLabel("batchedCI")).toBe("CI");
    expect(getBuildReasonLabel("pullRequest")).toBe("PR");
    expect(getBuildReasonLabel("schedule")).toBe("Scheduled");
  });

  it("returns raw value for unknown reasons", () => {
    expect(getBuildReasonLabel("custom")).toBe("custom");
  });
});
