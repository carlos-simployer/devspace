import React from "react";
import { Box, Text } from "ink";
import type { JiraIssue } from "../../api/types.ts";
import { relativeTime } from "../../utils/time.ts";
import { getIssueTypeIcon, getPriorityIcon } from "../../utils/jira-status.ts";
import { getTheme } from "../../ui/theme.ts";

/** Column widths for issue list layout */
export const JIRA_COL = {
  selector: 2, // "> " or "  "
  key: 12, // "UUX-1629"
  type: 3, // issue type icon
  assignee: 15,
  priority: 3,
  updated: 8,
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
  const titleWidth = getIssueTitleWidth(width);
  const updated = relativeTime(issue.fields.updated);

  const typeIcon = getIssueTypeIcon(issue.fields.issuetype.name);
  const priorityIcon = getPriorityIcon(issue.fields.priority.name);
  const assigneeName = issue.fields.assignee?.displayName ?? "Unassigned";

  const truncTitle =
    issue.fields.summary.length > titleWidth
      ? issue.fields.summary.slice(0, titleWidth - 1) + "\u2026"
      : issue.fields.summary;

  const selector = (isSelected ? "> " : "  ").slice(0, JIRA_COL.selector);
  const key = issue.key.padEnd(JIRA_COL.key);
  const typeCol = typeIcon.padEnd(JIRA_COL.type);
  const title = truncTitle.padEnd(titleWidth);
  const assignee = assigneeName
    .slice(0, JIRA_COL.assignee - 1)
    .padEnd(JIRA_COL.assignee);
  const priority = priorityIcon.padEnd(JIRA_COL.priority);
  const updatedText = updated.text.padEnd(JIRA_COL.updated);

  if (isSelected) {
    const line =
      selector + key + typeCol + title + assignee + priority + updatedText;
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
        <Text>{selector}</Text>
        <Text bold>{key}</Text>
        <Text color={getTypeColor(issue.fields.issuetype.name)}>{typeCol}</Text>
        <Text>{title}</Text>
        <Text dimColor>{assignee}</Text>
        <Text color={getPriorityColor(issue.fields.priority.name)}>
          {priority}
        </Text>
        <Text bold={updated.isRecent} dimColor={!updated.isRecent}>
          {updatedText}
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
