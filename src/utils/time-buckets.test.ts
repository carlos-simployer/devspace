import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PullRequest } from "../api/types.ts";
import {
  groupByTimeBucket,
  orderByTimeBucket,
  flattenGroups,
  groupByTimeBucketGeneric,
  flattenGroupsGeneric,
} from "./time-buckets.ts";
import type { PRGroup } from "./time-buckets.ts";

function makePR(
  createdAt: string,
  overrides: Partial<PullRequest> = {},
): PullRequest {
  return {
    id: `PR_${createdAt}`,
    number: 1,
    title: "Test PR",
    url: "https://github.com/org/repo/pull/1",
    isDraft: false,
    createdAt,
    updatedAt: createdAt,
    headRefName: "feature-branch",
    author: { login: "testuser" },
    repository: {
      name: "repo",
      url: "https://github.com/org/repo",
      owner: { login: "org" },
    },
    reviewDecision: null,
    latestReviews: { nodes: [] },
    reviewRequests: { totalCount: 0, nodes: [] },
    commits: {
      nodes: [{ commit: { statusCheckRollup: null } }],
    },
    labels: { nodes: [] },
    mergeable: "UNKNOWN",
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    ...overrides,
  };
}

describe("time-buckets", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Wednesday 2024-03-13 12:00:00 local time
    // Use a date constructor that creates a local-time date
    const fixedDate = new Date(2024, 2, 13, 12, 0, 0); // March 13, 2024 12:00 local
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to create a local-time ISO string for a given local date/time
  function localDate(
    year: number,
    month: number,
    day: number,
    hour = 12,
    minute = 0,
  ): string {
    return new Date(year, month - 1, day, hour, minute, 0).toISOString();
  }

  describe("groupByTimeBucket", () => {
    it('puts PR created today into "Today" bucket', () => {
      // Today is Wed March 13, 2024 — create PR at 8 AM today
      const pr = makePR(localDate(2024, 3, 13, 8, 0));
      const groups = groupByTimeBucket([pr]);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe("Today");
      expect(groups[0].prs).toHaveLength(1);
    });

    it('puts PR created Monday of this week into "This week" bucket', () => {
      // Monday March 11, 2024 (same week as Wednesday March 13)
      const pr = makePR(localDate(2024, 3, 11, 10, 0));
      const groups = groupByTimeBucket([pr]);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe("This week");
      expect(groups[0].prs).toHaveLength(1);
    });

    it('puts PR created last Wednesday into "Last week" bucket', () => {
      // Last Wednesday is March 6, 2024
      const pr = makePR(localDate(2024, 3, 6, 10, 0));
      const groups = groupByTimeBucket([pr]);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe("Last week");
      expect(groups[0].prs).toHaveLength(1);
    });

    it('puts PR created 3 weeks ago into "Older" bucket', () => {
      // 3 weeks ago: Feb 21, 2024
      const pr = makePR(localDate(2024, 2, 21, 10, 0));
      const groups = groupByTimeBucket([pr]);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe("Older");
      expect(groups[0].prs).toHaveLength(1);
    });

    it("returns empty array for empty input", () => {
      const groups = groupByTimeBucket([]);
      expect(groups).toEqual([]);
    });

    it("groups multiple PRs in the same bucket together", () => {
      const pr1 = makePR(localDate(2024, 3, 13, 8, 0), { id: "PR_A" });
      const pr2 = makePR(localDate(2024, 3, 13, 9, 0), { id: "PR_B" });
      const pr3 = makePR(localDate(2024, 3, 13, 10, 0), { id: "PR_C" });
      const groups = groupByTimeBucket([pr1, pr2, pr3]);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe("Today");
      expect(groups[0].prs).toHaveLength(3);
    });

    it("orders groups as Today, This week, Last week, Older", () => {
      const today = makePR(localDate(2024, 3, 13, 8, 0), { id: "today" });
      const thisWeek = makePR(localDate(2024, 3, 11, 8, 0), {
        id: "this-week",
      });
      const lastWeek = makePR(localDate(2024, 3, 6, 8, 0), {
        id: "last-week",
      });
      const older = makePR(localDate(2024, 2, 1, 8, 0), { id: "older" });

      // Provide in shuffled order
      const groups = groupByTimeBucket([older, thisWeek, today, lastWeek]);

      expect(groups.map((g) => g.label)).toEqual([
        "Today",
        "This week",
        "Last week",
        "Older",
      ]);
    });

    it("excludes empty buckets from output", () => {
      const today = makePR(localDate(2024, 3, 13, 8, 0));
      const older = makePR(localDate(2024, 2, 1, 8, 0));
      const groups = groupByTimeBucket([today, older]);
      expect(groups.map((g) => g.label)).toEqual(["Today", "Older"]);
    });

    describe("boundary: start of today", () => {
      it('PR at exactly midnight today is in "Today"', () => {
        const pr = makePR(localDate(2024, 3, 13, 0, 0));
        const groups = groupByTimeBucket([pr]);
        expect(groups[0].label).toBe("Today");
      });
    });

    describe("boundary: start of week (Monday)", () => {
      it('PR at midnight Monday is in "This week"', () => {
        // Monday March 11, 2024 at midnight local
        const pr = makePR(localDate(2024, 3, 11, 0, 0));
        const groups = groupByTimeBucket([pr]);
        expect(groups[0].label).toBe("This week");
      });

      it('PR just before midnight Monday is in "Last week" or earlier', () => {
        // Sunday March 10, 2024 at 23:59 local
        const pr = makePR(localDate(2024, 3, 10, 23, 59));
        const groups = groupByTimeBucket([pr]);
        expect(groups[0].label).toBe("Last week");
      });
    });
  });

  describe("orderByTimeBucket", () => {
    it("returns PRs in bucket order (Today first, Older last)", () => {
      const today = makePR(localDate(2024, 3, 13, 8, 0), { id: "today" });
      const older = makePR(localDate(2024, 2, 1, 8, 0), { id: "older" });
      const thisWeek = makePR(localDate(2024, 3, 11, 8, 0), {
        id: "this-week",
      });

      // Provide in reverse order
      const ordered = orderByTimeBucket([older, thisWeek, today]);
      expect(ordered.map((pr) => pr.id)).toEqual([
        "today",
        "this-week",
        "older",
      ]);
    });

    it("preserves original order within the same bucket", () => {
      const pr1 = makePR(localDate(2024, 3, 13, 8, 0), { id: "A" });
      const pr2 = makePR(localDate(2024, 3, 13, 9, 0), { id: "B" });
      const pr3 = makePR(localDate(2024, 3, 13, 10, 0), { id: "C" });

      const ordered = orderByTimeBucket([pr1, pr2, pr3]);
      expect(ordered.map((pr) => pr.id)).toEqual(["A", "B", "C"]);
    });

    it("returns empty array for empty input", () => {
      expect(orderByTimeBucket([])).toEqual([]);
    });
  });

  describe("flattenGroups", () => {
    it("interleaves headers and PRs correctly", () => {
      const pr1 = makePR(localDate(2024, 3, 13, 8, 0), { id: "today-1" });
      const pr2 = makePR(localDate(2024, 2, 1, 8, 0), { id: "older-1" });

      const groups: PRGroup[] = [
        { label: "Today", prs: [pr1] },
        { label: "Older", prs: [pr2] },
      ];

      const rows = flattenGroups(groups);
      expect(rows).toHaveLength(4); // 2 headers + 2 PRs

      expect(rows[0]).toEqual({
        type: "header",
        label: "Today",
        count: 1,
      });
      expect(rows[1]).toEqual({
        type: "pr",
        pr: pr1,
        prIndex: 0,
      });
      expect(rows[2]).toEqual({
        type: "header",
        label: "Older",
        count: 1,
      });
      expect(rows[3]).toEqual({
        type: "pr",
        pr: pr2,
        prIndex: 1,
      });
    });

    it("prIndex counts from 0 across groups", () => {
      const pr1 = makePR(localDate(2024, 3, 13, 8, 0), { id: "a" });
      const pr2 = makePR(localDate(2024, 3, 13, 9, 0), { id: "b" });
      const pr3 = makePR(localDate(2024, 2, 1, 8, 0), { id: "c" });

      const groups: PRGroup[] = [
        { label: "Today", prs: [pr1, pr2] },
        { label: "Older", prs: [pr3] },
      ];

      const rows = flattenGroups(groups);
      const prRows = rows.filter((r) => r.type === "pr");
      expect(prRows).toHaveLength(3);
      expect((prRows[0] as { prIndex: number }).prIndex).toBe(0);
      expect((prRows[1] as { prIndex: number }).prIndex).toBe(1);
      expect((prRows[2] as { prIndex: number }).prIndex).toBe(2);
    });

    it("returns empty array for empty groups", () => {
      expect(flattenGroups([])).toEqual([]);
    });

    it("header count reflects number of PRs in the group", () => {
      const pr1 = makePR(localDate(2024, 3, 13, 8, 0), { id: "a" });
      const pr2 = makePR(localDate(2024, 3, 13, 9, 0), { id: "b" });
      const pr3 = makePR(localDate(2024, 3, 13, 10, 0), { id: "c" });

      const groups: PRGroup[] = [{ label: "Today", prs: [pr1, pr2, pr3] }];

      const rows = flattenGroups(groups);
      expect(rows[0]).toEqual({
        type: "header",
        label: "Today",
        count: 3,
      });
    });
  });

  describe("groupByTimeBucketGeneric", () => {
    interface TestItem {
      id: string;
      date: string;
    }

    it("groups items by time bucket using a date accessor", () => {
      const items: TestItem[] = [
        { id: "a", date: localDate(2024, 3, 13, 8, 0) },
        { id: "b", date: localDate(2024, 2, 1, 8, 0) },
        { id: "c", date: localDate(2024, 3, 11, 8, 0) },
      ];

      const groups = groupByTimeBucketGeneric(items, (i) => i.date);

      expect(groups.map((g) => g.label)).toEqual([
        "Today",
        "This week",
        "Older",
      ]);
      expect(groups[0].items[0].id).toBe("a");
      expect(groups[1].items[0].id).toBe("c");
      expect(groups[2].items[0].id).toBe("b");
    });

    it("returns empty array for empty input", () => {
      const groups = groupByTimeBucketGeneric([], (i: any) => i.date);
      expect(groups).toEqual([]);
    });
  });

  describe("flattenGroupsGeneric", () => {
    it("interleaves headers and items correctly", () => {
      const groups = [
        { label: "Today" as const, items: [{ id: "a" }, { id: "b" }] },
        { label: "Older" as const, items: [{ id: "c" }] },
      ];

      const rows = flattenGroupsGeneric(groups);
      expect(rows).toHaveLength(5);
      expect(rows[0]).toEqual({ type: "header", label: "Today", count: 2 });
      expect(rows[1]).toEqual({
        type: "item",
        item: { id: "a" },
        itemIndex: 0,
      });
      expect(rows[2]).toEqual({
        type: "item",
        item: { id: "b" },
        itemIndex: 1,
      });
      expect(rows[3]).toEqual({ type: "header", label: "Older", count: 1 });
      expect(rows[4]).toEqual({
        type: "item",
        item: { id: "c" },
        itemIndex: 2,
      });
    });
  });
});
