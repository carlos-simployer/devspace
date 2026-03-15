import { describe, it, expect } from "vitest";
import type { JiraIssue } from "../api/types.ts";
import {
  groupByStatus,
  sortIssuesInGroups,
  getStatusColor,
  getIssueTypeIcon,
  getPriorityIcon,
  type JiraSortField,
} from "./jira-status.ts";
import { getTheme } from "../ui/theme.ts";

function makeJiraIssue(overrides: {
  key?: string;
  summary?: string;
  statusName?: string;
  statusCategoryKey?: string;
  issueTypeName?: string;
  priorityName?: string;
  assigneeName?: string | null;
  updated?: string;
}): JiraIssue {
  return {
    id: overrides.key ?? "10001",
    key: overrides.key ?? "UUX-1",
    fields: {
      summary: overrides.summary ?? "Test issue",
      status: {
        id: "1",
        name: overrides.statusName ?? "To Do",
        statusCategory: {
          id: 2,
          key: overrides.statusCategoryKey ?? "new",
          name: "To Do",
        },
      },
      issuetype: {
        id: "10001",
        name: overrides.issueTypeName ?? "Task",
        subtask: false,
        hierarchyLevel: 0,
      },
      priority: {
        id: "3",
        name: overrides.priorityName ?? "Medium",
      },
      assignee:
        overrides.assigneeName === null
          ? null
          : overrides.assigneeName
            ? { accountId: "a", displayName: overrides.assigneeName }
            : null,
      reporter: null,
      created: "2025-01-01T10:00:00.000+0000",
      updated: overrides.updated ?? "2025-01-02T10:00:00.000+0000",
      labels: [],
    },
  };
}

describe("groupByStatus", () => {
  it("should group issues by their status name", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", statusName: "To Do" }),
      makeJiraIssue({ key: "UUX-2", statusName: "In Progress" }),
      makeJiraIssue({ key: "UUX-3", statusName: "To Do" }),
    ];

    const groups = groupByStatus(issues, ["To Do", "In Progress"]);

    expect(groups).toHaveLength(2);
    expect(groups[0].status).toBe("To Do");
    expect(groups[0].issues).toHaveLength(2);
    expect(groups[0].issues[0].key).toBe("UUX-1");
    expect(groups[0].issues[1].key).toBe("UUX-3");
    expect(groups[1].status).toBe("In Progress");
    expect(groups[1].issues).toHaveLength(1);
    expect(groups[1].issues[0].key).toBe("UUX-2");
  });

  it("should order groups according to statusOrder", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", statusName: "Done" }),
      makeJiraIssue({ key: "UUX-2", statusName: "In Progress" }),
      makeJiraIssue({ key: "UUX-3", statusName: "To Do" }),
    ];

    const groups = groupByStatus(issues, ["In Progress", "To Do", "Done"]);

    expect(groups.map((g) => g.status)).toEqual([
      "In Progress",
      "To Do",
      "Done",
    ]);
  });

  it("should place unmatched statuses at the end", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", statusName: "In Review" }),
      makeJiraIssue({ key: "UUX-2", statusName: "To Do" }),
      makeJiraIssue({ key: "UUX-3", statusName: "Blocked" }),
    ];

    const groups = groupByStatus(issues, ["To Do"]);

    expect(groups).toHaveLength(3);
    expect(groups[0].status).toBe("To Do");
    expect(groups[1].status).toBe("In Review");
    expect(groups[2].status).toBe("Blocked");
  });

  it("should return empty array for empty input", () => {
    const groups = groupByStatus([], ["To Do", "In Progress"]);

    expect(groups).toEqual([]);
  });

  it("should handle a single issue", () => {
    const issues = [makeJiraIssue({ key: "UUX-1", statusName: "To Do" })];

    const groups = groupByStatus(issues, ["To Do"]);

    expect(groups).toHaveLength(1);
    expect(groups[0].status).toBe("To Do");
    expect(groups[0].issues).toHaveLength(1);
  });

  it("should include status category in each group", () => {
    const issues = [
      makeJiraIssue({
        key: "UUX-1",
        statusName: "In Progress",
        statusCategoryKey: "indeterminate",
      }),
      makeJiraIssue({
        key: "UUX-2",
        statusName: "Done",
        statusCategoryKey: "done",
      }),
    ];

    const groups = groupByStatus(issues, ["In Progress", "Done"]);

    expect(groups[0].category).toBe("indeterminate");
    expect(groups[1].category).toBe("done");
  });

  it("should handle all issues having unmatched statuses", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", statusName: "Blocked" }),
      makeJiraIssue({ key: "UUX-2", statusName: "Waiting" }),
    ];

    const groups = groupByStatus(issues, ["To Do", "In Progress"]);

    expect(groups).toHaveLength(2);
    expect(groups[0].status).toBe("Blocked");
    expect(groups[1].status).toBe("Waiting");
  });

  it("should handle empty statusOrder array", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", statusName: "To Do" }),
      makeJiraIssue({ key: "UUX-2", statusName: "Done" }),
    ];

    const groups = groupByStatus(issues, []);

    expect(groups).toHaveLength(2);
    expect(groups[0].status).toBe("To Do");
    expect(groups[1].status).toBe("Done");
  });

  it("should ignore statusOrder entries with no matching issues", () => {
    const issues = [makeJiraIssue({ key: "UUX-1", statusName: "To Do" })];

    const groups = groupByStatus(issues, ["In Progress", "To Do", "Done"]);

    expect(groups).toHaveLength(1);
    expect(groups[0].status).toBe("To Do");
  });
});

describe("getStatusColor", () => {
  const theme = getTheme();

  it("should return info color for 'new' category", () => {
    expect(getStatusColor("new")).toBe(theme.status.info);
  });

  it("should return pending color for 'indeterminate' category", () => {
    expect(getStatusColor("indeterminate")).toBe(theme.status.pending);
  });

  it("should return success color for 'done' category", () => {
    expect(getStatusColor("done")).toBe(theme.status.success);
  });

  it("should return muted color for unknown category", () => {
    expect(getStatusColor("something-else")).toBe(theme.status.muted);
  });

  it("should return muted color for empty string", () => {
    expect(getStatusColor("")).toBe(theme.status.muted);
  });
});

describe("getIssueTypeIcon", () => {
  it("should return filled circle for Bug", () => {
    expect(getIssueTypeIcon("Bug")).toBe("\u25CF");
  });

  it("should return filled square for Story", () => {
    expect(getIssueTypeIcon("Story")).toBe("\u25A0");
  });

  it("should return lightning bolt for Epic", () => {
    expect(getIssueTypeIcon("Epic")).toBe("\u26A1");
  });

  it("should return check mark for Task", () => {
    expect(getIssueTypeIcon("Task")).toBe("\u2713");
  });

  it("should return corner for Sub-task", () => {
    expect(getIssueTypeIcon("Sub-task")).toBe("\u2514");
  });

  it("should return corner for subtask (alternative casing)", () => {
    expect(getIssueTypeIcon("Subtask")).toBe("\u2514");
  });

  it("should be case-insensitive", () => {
    expect(getIssueTypeIcon("bug")).toBe("\u25CF");
    expect(getIssueTypeIcon("BUG")).toBe("\u25CF");
    expect(getIssueTypeIcon("STORY")).toBe("\u25A0");
    expect(getIssueTypeIcon("epic")).toBe("\u26A1");
    expect(getIssueTypeIcon("task")).toBe("\u2713");
    expect(getIssueTypeIcon("SUB-TASK")).toBe("\u2514");
  });

  it("should return bullet for unknown type", () => {
    expect(getIssueTypeIcon("Improvement")).toBe("\u2022");
  });

  it("should return bullet for empty string", () => {
    expect(getIssueTypeIcon("")).toBe("\u2022");
  });
});

describe("getPriorityIcon", () => {
  it("should return double up arrow for Highest", () => {
    expect(getPriorityIcon("Highest")).toBe("\u2191\u2191");
  });

  it("should return up arrow for High", () => {
    expect(getPriorityIcon("High")).toBe("\u2191");
  });

  it("should return right arrow for Medium", () => {
    expect(getPriorityIcon("Medium")).toBe("\u2192");
  });

  it("should return down arrow for Low", () => {
    expect(getPriorityIcon("Low")).toBe("\u2193");
  });

  it("should return double down arrow for Lowest", () => {
    expect(getPriorityIcon("Lowest")).toBe("\u2193\u2193");
  });

  it("should be case-insensitive", () => {
    expect(getPriorityIcon("highest")).toBe("\u2191\u2191");
    expect(getPriorityIcon("HIGHEST")).toBe("\u2191\u2191");
    expect(getPriorityIcon("high")).toBe("\u2191");
    expect(getPriorityIcon("medium")).toBe("\u2192");
    expect(getPriorityIcon("low")).toBe("\u2193");
    expect(getPriorityIcon("lowest")).toBe("\u2193\u2193");
  });

  it("should return em dash for unknown priority", () => {
    expect(getPriorityIcon("Critical")).toBe("\u2014");
  });

  it("should return em dash for empty string", () => {
    expect(getPriorityIcon("")).toBe("\u2014");
  });
});

describe("sortIssuesInGroups", () => {
  const makeGroup = (issues: JiraIssue[]) => groupByStatus(issues, ["To Do"]);

  it("should sort by updated (newest first)", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", updated: "2025-01-01T00:00:00Z" }),
      makeJiraIssue({ key: "UUX-2", updated: "2025-01-03T00:00:00Z" }),
      makeJiraIssue({ key: "UUX-3", updated: "2025-01-02T00:00:00Z" }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["updated"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual([
      "UUX-2",
      "UUX-3",
      "UUX-1",
    ]);
  });

  it("should sort by priority (highest first)", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", priorityName: "Low" }),
      makeJiraIssue({ key: "UUX-2", priorityName: "Highest" }),
      makeJiraIssue({ key: "UUX-3", priorityName: "Medium" }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["priority"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual([
      "UUX-2",
      "UUX-3",
      "UUX-1",
    ]);
  });

  it("should sort by priority then updated as tiebreaker", () => {
    const issues = [
      makeJiraIssue({
        key: "UUX-1",
        priorityName: "Medium",
        updated: "2025-01-01T00:00:00Z",
      }),
      makeJiraIssue({
        key: "UUX-2",
        priorityName: "Medium",
        updated: "2025-01-03T00:00:00Z",
      }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["priority", "updated"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual(["UUX-2", "UUX-1"]);
  });

  it("should sort by assignee (alphabetical, unassigned last)", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", assigneeName: null }),
      makeJiraIssue({ key: "UUX-2", assigneeName: "Zara" }),
      makeJiraIssue({ key: "UUX-3", assigneeName: "Alice" }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["assignee"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual([
      "UUX-3",
      "UUX-2",
      "UUX-1",
    ]);
  });

  it("should sort by key (newest number first)", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-5" }),
      makeJiraIssue({ key: "UUX-100" }),
      makeJiraIssue({ key: "UUX-42" }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["key"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual([
      "UUX-100",
      "UUX-42",
      "UUX-5",
    ]);
  });

  it("should not modify the original groups", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-2", updated: "2025-01-03T00:00:00Z" }),
      makeJiraIssue({ key: "UUX-1", updated: "2025-01-01T00:00:00Z" }),
    ];
    const groups = makeGroup(issues);
    const originalKeys = groups[0]!.issues.map((i) => i.key);
    sortIssuesInGroups(groups, ["updated"]);
    expect(groups[0]!.issues.map((i) => i.key)).toEqual(originalKeys);
  });

  it("should sort each group independently", () => {
    const issues = [
      makeJiraIssue({
        key: "UUX-1",
        statusName: "To Do",
        updated: "2025-01-01T00:00:00Z",
      }),
      makeJiraIssue({
        key: "UUX-2",
        statusName: "In Progress",
        statusCategoryKey: "indeterminate",
        updated: "2025-01-03T00:00:00Z",
      }),
      makeJiraIssue({
        key: "UUX-3",
        statusName: "To Do",
        updated: "2025-01-02T00:00:00Z",
      }),
      makeJiraIssue({
        key: "UUX-4",
        statusName: "In Progress",
        statusCategoryKey: "indeterminate",
        updated: "2025-01-01T00:00:00Z",
      }),
    ];
    const groups = groupByStatus(issues, ["In Progress", "To Do"]);
    const sorted = sortIssuesInGroups(groups, ["updated"]);
    expect(sorted[0]!.status).toBe("In Progress");
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual(["UUX-2", "UUX-4"]);
    expect(sorted[1]!.status).toBe("To Do");
    expect(sorted[1]!.issues.map((i) => i.key)).toEqual(["UUX-3", "UUX-1"]);
  });

  it("should sort by type (bug first, then story, task, etc.)", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-1", issueTypeName: "Task" }),
      makeJiraIssue({ key: "UUX-2", issueTypeName: "Bug" }),
      makeJiraIssue({ key: "UUX-3", issueTypeName: "Story" }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["type"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual([
      "UUX-2",
      "UUX-3",
      "UUX-1",
    ]);
  });

  it("should sort by multiple fields in priority order", () => {
    const issues = [
      makeJiraIssue({
        key: "UUX-1",
        priorityName: "High",
        assigneeName: "Zara",
      }),
      makeJiraIssue({
        key: "UUX-2",
        priorityName: "High",
        assigneeName: "Alice",
      }),
      makeJiraIssue({
        key: "UUX-3",
        priorityName: "Low",
        assigneeName: "Alice",
      }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, ["priority", "assignee"]);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual([
      "UUX-2",
      "UUX-1",
      "UUX-3",
    ]);
  });

  it("should return unmodified groups when sortFields is empty", () => {
    const issues = [
      makeJiraIssue({ key: "UUX-2" }),
      makeJiraIssue({ key: "UUX-1" }),
    ];
    const groups = makeGroup(issues);
    const sorted = sortIssuesInGroups(groups, []);
    expect(sorted[0]!.issues.map((i) => i.key)).toEqual(["UUX-2", "UUX-1"]);
  });
});
