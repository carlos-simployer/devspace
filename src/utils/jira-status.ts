import type { JiraIssue } from "../api/types.ts";
import { getTheme } from "../ui/theme.ts";

export interface StatusGroup {
  status: string;
  category: string; // "new" | "indeterminate" | "done"
  issues: JiraIssue[];
}

export function groupByStatus(
  issues: JiraIssue[],
  statusOrder: string[],
): StatusGroup[] {
  const groupMap = new Map<string, StatusGroup>();

  for (const issue of issues) {
    const statusName = issue.fields.status.name;
    const category = issue.fields.status.statusCategory.key;

    let group = groupMap.get(statusName);
    if (!group) {
      group = { status: statusName, category, issues: [] };
      groupMap.set(statusName, group);
    }
    group.issues.push(issue);
  }

  const ordered: StatusGroup[] = [];
  const seen = new Set<string>();

  for (const name of statusOrder) {
    const group = groupMap.get(name);
    if (group) {
      ordered.push(group);
      seen.add(name);
    }
  }

  for (const [name, group] of groupMap) {
    if (!seen.has(name)) {
      ordered.push(group);
    }
  }

  return ordered;
}

export type JiraSortField =
  | "updated"
  | "priority"
  | "assignee"
  | "key"
  | "type"
  | "summary";

export const ALL_SORT_FIELDS: JiraSortField[] = [
  "key",
  "type",
  "summary",
  "assignee",
  "priority",
  "updated",
];

export const SORT_FIELD_LABELS: Record<JiraSortField, string> = {
  updated: "Updated",
  priority: "Priority",
  assignee: "Assignee",
  type: "Type",
  key: "Key",
  summary: "Summary",
};

const PRIORITY_ORDER: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};

const TYPE_ORDER: Record<string, number> = {
  bug: 0,
  story: 1,
  task: 2,
  "sub-task": 3,
  subtask: 3,
  epic: 4,
};

/**
 * Sort issues within each status group by multiple fields.
 * Fields are applied in priority order — first field is primary sort.
 * Does not modify the input.
 */
export function sortIssuesInGroups(
  groups: StatusGroup[],
  sortFields: JiraSortField[],
): StatusGroup[] {
  if (sortFields.length === 0) return groups;
  return groups.map((group) => ({
    ...group,
    issues: [...group.issues].sort((a, b) => {
      for (const field of sortFields) {
        const cmp = compareByField(a, b, field);
        if (cmp !== 0) return cmp;
      }
      return 0;
    }),
  }));
}

function compareByField(
  a: JiraIssue,
  b: JiraIssue,
  field: JiraSortField,
): number {
  switch (field) {
    case "updated":
      return (
        new Date(b.fields.updated).getTime() -
        new Date(a.fields.updated).getTime()
      );
    case "priority": {
      const pa = PRIORITY_ORDER[a.fields.priority.name.toLowerCase()] ?? 5;
      const pb = PRIORITY_ORDER[b.fields.priority.name.toLowerCase()] ?? 5;
      return pa - pb;
    }
    case "assignee": {
      const na = a.fields.assignee?.displayName ?? "\uffff";
      const nb = b.fields.assignee?.displayName ?? "\uffff";
      return na.localeCompare(nb);
    }
    case "type": {
      const ta = TYPE_ORDER[a.fields.issuetype.name.toLowerCase()] ?? 99;
      const tb = TYPE_ORDER[b.fields.issuetype.name.toLowerCase()] ?? 99;
      return ta - tb;
    }
    case "summary":
      return a.fields.summary.localeCompare(b.fields.summary);
    case "key": {
      const numA = parseInt(a.key.split("-")[1] ?? "0", 10);
      const numB = parseInt(b.key.split("-")[1] ?? "0", 10);
      return numB - numA;
    }
  }
}

export function getStatusColor(category: string): string {
  const theme = getTheme();

  switch (category) {
    case "new":
      return theme.status.info;
    case "indeterminate":
      return theme.status.pending;
    case "done":
      return theme.status.success;
    default:
      return theme.status.muted;
  }
}

export function getIssueTypeIcon(typeName: string): string {
  switch (typeName.toLowerCase()) {
    case "bug":
      return "\u25CF"; // filled circle
    case "story":
      return "\u25A0"; // filled square
    case "epic":
      return "\u26A1"; // lightning bolt
    case "task":
      return "\u2713"; // check mark
    case "sub-task":
    case "subtask":
      return "\u2514"; // corner
    default:
      return "\u2022"; // bullet
  }
}

export function getPriorityIcon(priorityName: string): string {
  switch (priorityName.toLowerCase()) {
    case "highest":
      return "\u2191\u2191"; // double up arrow
    case "high":
      return "\u2191"; // up arrow
    case "medium":
      return "\u2192"; // right arrow
    case "low":
      return "\u2193"; // down arrow
    case "lowest":
      return "\u2193\u2193"; // double down arrow
    default:
      return "\u2014"; // em dash
  }
}
