import { describe, it, expect, vi, afterEach } from "vitest";
import type { ConfigV1 } from "../api/types.ts";
import {
  migrateV1toV2,
  pruneLastViewed,
  DEFAULT_REFRESH_INTERVAL,
} from "./config-migration.ts";

describe("migrateV1toV2", () => {
  it("sets version to 2", () => {
    const v1: ConfigV1 = { org: "myorg", repos: [], trackedPackages: [] };
    const result = migrateV1toV2(v1);
    expect(result.version).toBe(2);
  });

  it("converts v1.org to orgs array and activeOrg", () => {
    const v1: ConfigV1 = { org: "myorg", repos: [], trackedPackages: [] };
    const result = migrateV1toV2(v1);
    expect(result.orgs).toEqual(["myorg"]);
    expect(result.activeOrg).toBe("myorg");
  });

  it("handles empty org string", () => {
    const v1: ConfigV1 = { org: "", repos: [], trackedPackages: [] };
    const result = migrateV1toV2(v1);
    expect(result.orgs).toEqual([]);
    expect(result.activeOrg).toBe("");
  });

  it("qualifies bare repo names with org prefix", () => {
    const v1: ConfigV1 = {
      org: "myorg",
      repos: ["my-repo", "other-repo"],
      trackedPackages: [],
    };
    const result = migrateV1toV2(v1);
    expect(result.repos).toEqual(["myorg/my-repo", "myorg/other-repo"]);
  });

  it("already qualified repo names stay unchanged", () => {
    const v1: ConfigV1 = {
      org: "myorg",
      repos: ["otherorg/already-qualified"],
      trackedPackages: [],
    };
    const result = migrateV1toV2(v1);
    expect(result.repos).toEqual(["otherorg/already-qualified"]);
  });

  it("preserves trackedPackages", () => {
    const v1: ConfigV1 = {
      org: "myorg",
      repos: [],
      trackedPackages: ["@scope/pkg-a", "pkg-b"],
    };
    const result = migrateV1toV2(v1);
    expect(result.trackedPackages).toEqual(["@scope/pkg-a", "pkg-b"]);
  });

  it("initializes lastViewed as empty object", () => {
    const v1: ConfigV1 = { org: "myorg", repos: [], trackedPackages: [] };
    const result = migrateV1toV2(v1);
    expect(result.lastViewed).toEqual({});
  });

  it("sets default refresh interval", () => {
    const v1: ConfigV1 = { org: "myorg", repos: [], trackedPackages: [] };
    const result = migrateV1toV2(v1);
    expect(result.refreshInterval).toBe(DEFAULT_REFRESH_INTERVAL);
  });
});

describe("pruneLastViewed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps entries less than 30 days old", () => {
    vi.useFakeTimers();
    const now = new Date("2024-03-13T12:00:00Z").getTime();
    vi.setSystemTime(now);

    const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
    const result = pruneLastViewed({ PR_1: oneDayAgo });
    expect(result).toEqual({ PR_1: oneDayAgo });
  });

  it("removes entries more than 30 days old", () => {
    vi.useFakeTimers();
    const now = new Date("2024-03-13T12:00:00Z").getTime();
    vi.setSystemTime(now);

    const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
    const result = pruneLastViewed({ PR_1: thirtyOneDaysAgo });
    expect(result).toEqual({});
  });

  it("empty input returns empty object", () => {
    const result = pruneLastViewed({});
    expect(result).toEqual({});
  });

  it("handles mix of old and new entries", () => {
    vi.useFakeTimers();
    const now = new Date("2024-03-13T12:00:00Z").getTime();
    vi.setSystemTime(now);

    const recent = now - 5 * 24 * 60 * 60 * 1000;
    const old = now - 31 * 24 * 60 * 60 * 1000;

    const result = pruneLastViewed({
      PR_recent: recent,
      PR_old: old,
    });
    expect(result).toEqual({ PR_recent: recent });
  });
});
