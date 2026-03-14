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
