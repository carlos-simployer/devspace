import React from "react";
import { Box, Text } from "ink";
import type { JiraIssue } from "../../api/types.ts";
import { relativeTime } from "../../utils/time.ts";
import { getIssueTypeIcon, getPriorityIcon } from "../../utils/jira-status.ts";
import { getTheme } from "../../ui/theme.ts";

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

function typeLabel(typeName: string): string {
  return typeName;
}

function prioLabel(priorityName: string): string {
  return priorityName;
}

export function IssueRow({ issue, isSelected, width }: Props) {
  const titleWidth = getIssueTitleWidth(width);
  const updated = relativeTime(issue.fields.updated);
  const assigneeName = issue.fields.assignee?.displayName ?? "Unassigned";

  const truncTitle =
    issue.fields.summary.length > titleWidth
      ? issue.fields.summary.slice(0, titleWidth - 1) + "\u2026"
      : issue.fields.summary;

  const sel = isSelected ? " > " : "   ";
  const key = issue.key.padEnd(JIRA_COL.key);
  const tp = typeLabel(issue.fields.issuetype.name).padEnd(JIRA_COL.type);
  const title = truncTitle.padEnd(titleWidth);
  const assignee = assigneeName
    .slice(0, JIRA_COL.assignee - 1)
    .padEnd(JIRA_COL.assignee);
  const prio = prioLabel(issue.fields.priority.name).padEnd(JIRA_COL.priority);
  const upd = updated.text.padEnd(JIRA_COL.updated);

  if (isSelected) {
    const content = sel + key + tp + title + assignee + prio + upd;
    const line =
      content.length < width
        ? content + " ".repeat(width - content.length)
        : content;
    return (
      <Box>
        <Text inverse bold>
          {line}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text>
        {sel}
        <Text bold>{key}</Text>
        <Text color={getTypeColor(issue.fields.issuetype.name)}>{tp}</Text>
        {title}
        <Text dimColor>{assignee}</Text>
        <Text color={getPriorityColor(issue.fields.priority.name)}>{prio}</Text>
        <Text bold={updated.isRecent} dimColor={!updated.isRecent}>
          {upd}
        </Text>
      </Text>
    </Box>
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
