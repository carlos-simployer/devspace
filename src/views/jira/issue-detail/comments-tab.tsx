import React from "react";
import { Text } from "ink";
import type { JiraIssue } from "../../../api/types.ts";
import { relativeTime } from "../../../utils/time.ts";
import { extractAdfText } from "./overview-tab.tsx";
import { getTheme } from "../../../ui/theme.ts";

type LineEntry = { key: string; node: React.ReactNode };

export function buildCommentsLines(issue: JiraIssue): LineEntry[] {
  const lines: LineEntry[] = [];
  const theme = getTheme();
  const comments = issue.fields.comment?.comments ?? [];

  lines.push({
    key: "comments-header",
    node: (
      <Text bold color={theme.ui.heading}>
        Comments ({comments.length})
      </Text>
    ),
  });

  lines.push({ key: "spacer0", node: <Text> </Text> });

  if (comments.length === 0) {
    lines.push({
      key: "no-comments",
      node: <Text dimColor>No comments</Text>,
    });
    return lines;
  }

  comments.forEach((comment, i) => {
    const author = comment.author.displayName;
    const time = relativeTime(comment.created);

    lines.push({
      key: `comment-author-${i}`,
      node: (
        <Text>
          <Text bold>{author}</Text>
          <Text dimColor>
            {" "}
            {"\u2014"} {time.text} ago
          </Text>
        </Text>
      ),
    });

    const bodyText = extractAdfText(comment.body).trim();
    const bodyLines = bodyText.split("\n");
    bodyLines.forEach((line, j) => {
      lines.push({
        key: `comment-body-${i}-${j}`,
        node: (
          <Text>
            {"  "}
            {line || " "}
          </Text>
        ),
      });
    });

    // Add separator between comments
    if (i < comments.length - 1) {
      lines.push({
        key: `comment-sep-${i}`,
        node: <Text dimColor>{"  \u2500".repeat(20)}</Text>,
      });
    }
  });

  return lines;
}
