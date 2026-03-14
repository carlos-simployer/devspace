import React from "react";
import { Text } from "ink";
import type { JiraIssue } from "../../../api/types.ts";
import { relativeTime } from "../../../utils/time.ts";
import {
  getStatusColor,
  getIssueTypeIcon,
  getPriorityIcon,
} from "../../../utils/jira-status.ts";
import { getTheme } from "../../../ui/theme.ts";

type LineEntry = { key: string; node: React.ReactNode };

/**
 * Extract plain text from Atlassian Document Format (ADF).
 * Recursively walks the nested content structure to pull text nodes.
 */
function extractAdfText(adf: any): string {
  if (!adf) return "";
  if (typeof adf === "string") return adf;

  // Text node
  if (adf.type === "text" && typeof adf.text === "string") {
    return adf.text;
  }

  // Container nodes with content array
  if (Array.isArray(adf.content)) {
    const parts = adf.content.map((child: any) => extractAdfText(child));

    // Add newlines between block-level elements
    if (
      adf.type === "paragraph" ||
      adf.type === "heading" ||
      adf.type === "bulletList" ||
      adf.type === "orderedList" ||
      adf.type === "codeBlock" ||
      adf.type === "blockquote"
    ) {
      return parts.join("") + "\n";
    }

    if (adf.type === "listItem") {
      return "  \u2022 " + parts.join("") + "\n";
    }

    return parts.join("");
  }

  return "";
}

export function buildOverviewLines(
  issue: JiraIssue,
  loading: boolean,
  error: string | null,
): LineEntry[] {
  const lines: LineEntry[] = [];
  const theme = getTheme();
  const { fields } = issue;

  // Title
  lines.push({
    key: "title",
    node: (
      <Text bold color={theme.ui.heading}>
        {issue.key} {fields.summary}
      </Text>
    ),
  });

  lines.push({ key: "spacer1", node: <Text> </Text> });

  // Status + Type
  const statusColor = getStatusColor(fields.status.statusCategory.key);
  const typeIcon = getIssueTypeIcon(fields.issuetype.name);
  lines.push({
    key: "status-type",
    node: (
      <Text>
        <Text dimColor>Status: </Text>
        <Text bold color={statusColor}>
          {fields.status.name}
        </Text>
        <Text dimColor> | Type: </Text>
        <Text>
          {typeIcon} {fields.issuetype.name}
        </Text>
      </Text>
    ),
  });

  // Priority + Assignee
  const priorityIcon = getPriorityIcon(fields.priority.name);
  lines.push({
    key: "priority-assignee",
    node: (
      <Text>
        <Text dimColor>Priority: </Text>
        <Text>
          {priorityIcon} {fields.priority.name}
        </Text>
        <Text dimColor> | Assignee: </Text>
        <Text>{fields.assignee?.displayName ?? "Unassigned"}</Text>
      </Text>
    ),
  });

  // Reporter
  lines.push({
    key: "reporter",
    node: (
      <Text>
        <Text dimColor>Reporter: </Text>
        <Text>{fields.reporter?.displayName ?? "Unknown"}</Text>
      </Text>
    ),
  });

  // Dates
  lines.push({
    key: "dates",
    node: (
      <Text>
        <Text dimColor>Created: </Text>
        <Text>{relativeTime(fields.created).text} ago</Text>
        <Text dimColor> | Updated: </Text>
        <Text>{relativeTime(fields.updated).text} ago</Text>
      </Text>
    ),
  });

  // Parent
  if (fields.parent) {
    lines.push({
      key: "parent",
      node: (
        <Text>
          <Text dimColor>Parent: </Text>
          <Text bold>{fields.parent.key}</Text>
          <Text> {fields.parent.fields.summary}</Text>
        </Text>
      ),
    });
  }

  // Labels
  if (fields.labels.length > 0) {
    lines.push({
      key: "labels",
      node: (
        <Text>
          <Text dimColor>Labels: </Text>
          <Text>{fields.labels.join(", ")}</Text>
        </Text>
      ),
    });
  }

  // Fix Versions
  if (fields.fixVersions && fields.fixVersions.length > 0) {
    lines.push({
      key: "fix-versions",
      node: (
        <Text>
          <Text dimColor>Fix Versions: </Text>
          <Text>{fields.fixVersions.map((v) => v.name).join(", ")}</Text>
        </Text>
      ),
    });
  }

  lines.push({ key: "spacer2", node: <Text> </Text> });

  // Description
  if (loading) {
    lines.push({
      key: "loading",
      node: <Text color={theme.status.pending}>Loading issue details...</Text>,
    });
  } else if (error) {
    lines.push({
      key: "error",
      node: <Text color={theme.status.failure}>Error: {error}</Text>,
    });
  } else {
    lines.push({
      key: "desc-header",
      node: (
        <Text bold dimColor>
          Description
        </Text>
      ),
    });

    const descText = fields.description
      ? extractAdfText(fields.description).trim()
      : "No description";

    const descLines = descText.split("\n");
    descLines.forEach((line, i) => {
      lines.push({
        key: `desc-${i}`,
        node: <Text>{line || " "}</Text>,
      });
    });
  }

  return lines;
}

export { extractAdfText };
