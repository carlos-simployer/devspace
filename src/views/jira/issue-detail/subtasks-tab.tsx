import React from "react";
import { Text } from "ink";
import type { JiraIssue } from "../../../api/types.ts";
import {
  getStatusColor,
  getIssueTypeIcon,
} from "../../../utils/jira-status.ts";
import { getTheme } from "../../../ui/theme.ts";

type LineEntry = { key: string; node: React.ReactNode };

export function buildSubtasksLines(issue: JiraIssue): LineEntry[] {
  const lines: LineEntry[] = [];
  const theme = getTheme();
  const subtasks = issue.fields.subtasks ?? [];

  lines.push({
    key: "subtasks-header",
    node: (
      <Text bold color={theme.ui.heading}>
        Subtasks ({subtasks.length})
      </Text>
    ),
  });

  lines.push({ key: "spacer0", node: <Text> </Text> });

  if (subtasks.length === 0) {
    lines.push({
      key: "no-subtasks",
      node: <Text dimColor>No subtasks</Text>,
    });
    return lines;
  }

  subtasks.forEach((subtask, i) => {
    const statusColor = getStatusColor(
      subtask.fields.status.statusCategory.key,
    );
    const statusName = subtask.fields.status.name;
    const typeIcon = getIssueTypeIcon(subtask.fields.issuetype.name);

    lines.push({
      key: `subtask-${i}`,
      node: (
        <Text>
          {"  "}
          <Text bold>{subtask.key.padEnd(12)}</Text>
          <Text color={statusColor}>
            {typeIcon} {statusName.padEnd(15)}
          </Text>
          <Text>{subtask.fields.summary}</Text>
        </Text>
      ),
    });
  });

  return lines;
}
