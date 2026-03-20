import React from "react";
import type { JiraIssue } from "../../api/types.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";
import { TableRow } from "../../ui/table-row.tsx";

/** Column widths for issue list layout */
export const JIRA_COL = {
  selector: 3, // "> " or "  "
  key: 12, // "UUX-1629"
  type: 9, // "Sub-task" + space
  assignee: 18,
  priority: 9, // "Highest" + space
  updated: 8, // "Updated" + space
} as const;

export function getIssueTitleWidth(totalWidth: number): number {
  const fixed =
    JIRA_COL.selector +
    JIRA_COL.key +
    JIRA_COL.type +
    JIRA_COL.assignee +
    JIRA_COL.priority +
    JIRA_COL.updated;
  return Math.max(10, totalWidth - fixed);
}

interface Props {
  issue: JiraIssue;
  isSelected: boolean;
  width: number;
}

export function IssueRow({ issue, isSelected, width }: Props) {
  const updated = relativeTime(issue.fields.updated);
  const assigneeName = issue.fields.assignee?.displayName ?? "Unassigned";

  return (
    <TableRow
      selected={isSelected}
      width={width}
      columns={[
        {
          width: JIRA_COL.selector,
          content: isSelected ? " > " : "   ",
        },
        { width: JIRA_COL.key, content: issue.key, bold: true },
        {
          width: JIRA_COL.type,
          content: issue.fields.issuetype.name,
          color: getTypeColor(issue.fields.issuetype.name),
        },
        { flex: 1, content: issue.fields.summary },
        {
          width: JIRA_COL.assignee,
          content: assigneeName,
          dimColor: true,
        },
        {
          width: JIRA_COL.priority,
          content: issue.fields.priority.name,
          color: getPriorityColor(issue.fields.priority.name),
        },
        {
          width: JIRA_COL.updated,
          content: updated.text,
          bold: updated.isRecent,
          dimColor: !updated.isRecent,
        },
      ]}
    />
  );
}

function getTypeColor(typeName: string): string {
  const theme = getTheme();
  switch (typeName.toLowerCase()) {
    case "bug":
      return theme.status.failure;
    case "story":
      return theme.status.success;
    case "epic":
      return theme.status.info;
    default:
      return theme.status.muted;
  }
}

function getPriorityColor(priorityName: string): string {
  const theme = getTheme();
  switch (priorityName.toLowerCase()) {
    case "highest":
    case "high":
      return theme.status.failure;
    case "medium":
      return theme.status.pending;
    case "low":
    case "lowest":
      return theme.status.info;
    default:
      return theme.status.muted;
  }
}
