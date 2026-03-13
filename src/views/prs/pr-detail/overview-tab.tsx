import React from "react";
import { Text } from "ink";
import type { PullRequest } from "../../../api/types.ts";
import type { PRDetail } from "../../../hooks/use-pr-detail.ts";
import { relativeTime } from "../../../utils/time.ts";
import { renderMarkdown } from "../../../utils/markdown.ts";
import { getCheckIcon } from "../../../utils/status.ts";
import { getTheme } from "../../../ui/theme.ts";

type LineEntry = { key: string; node: React.ReactNode };

export function buildOverviewLines(
  pr: PullRequest,
  detail: PRDetail | null,
  loading: boolean,
  error: string | null,
): LineEntry[] {
  const lines: LineEntry[] = [];

  const labels = pr.labels?.nodes ?? [];
  const mergeStatus =
    pr.mergeable === "CONFLICTING"
      ? "Conflicts"
      : pr.mergeable === "MERGEABLE"
        ? "Mergeable"
        : "Unknown";

  lines.push({
    key: "title",
    node: (
      <Text bold color={getTheme().ui.heading}>
        #{pr.number} {pr.title}
      </Text>
    ),
  });

  lines.push({ key: "spacer1", node: <Text> </Text> });

  lines.push({
    key: "meta1",
    node: (
      <Text>
        <Text dimColor>Author: </Text>
        <Text>{pr.author.name || pr.author.login}</Text>
        <Text dimColor> │ Branch: </Text>
        <Text color={getTheme().meta.branch}>{pr.headRefName}</Text>
      </Text>
    ),
  });

  lines.push({
    key: "meta2",
    node: (
      <Text>
        <Text dimColor>Created: </Text>
        <Text>{relativeTime(pr.createdAt).text} ago</Text>
        <Text dimColor> │ Updated: </Text>
        <Text>{relativeTime(pr.updatedAt).text} ago</Text>
        <Text dimColor> │ </Text>
        {pr.isDraft ? (
          <Text color={getTheme().meta.draft}>Draft</Text>
        ) : (
          <Text color={getTheme().meta.ready}>Ready</Text>
        )}
      </Text>
    ),
  });

  lines.push({
    key: "meta3",
    node: (
      <Text>
        <Text dimColor>Merge: </Text>
        <Text
          color={
            pr.mergeable === "CONFLICTING"
              ? getTheme().status.failure
              : getTheme().status.success
          }
        >
          {mergeStatus}
        </Text>
        <Text dimColor> │ Diff: </Text>
        <Text color={getTheme().diff.added}>+{pr.additions}</Text>
        <Text dimColor> </Text>
        <Text color={getTheme().diff.removed}>-{pr.deletions}</Text>
        <Text dimColor> ({pr.changedFiles} files)</Text>
      </Text>
    ),
  });

  if (labels.length > 0) {
    lines.push({
      key: "labels",
      node: (
        <Text>
          <Text dimColor>Labels: </Text>
          {labels.map((l, i) => (
            <Text key={l.name}>
              {i > 0 ? ", " : ""}
              {l.name}
            </Text>
          ))}
        </Text>
      ),
    });
  }

  lines.push({ key: "spacer2", node: <Text> </Text> });

  if (loading) {
    lines.push({
      key: "loading",
      node: <Text color={getTheme().status.pending}>Loading details...</Text>,
    });
  } else if (error) {
    lines.push({
      key: "error",
      node: <Text color={getTheme().status.failure}>Error: {error}</Text>,
    });
  } else if (detail) {
    lines.push({
      key: "desc-header",
      node: (
        <Text bold dimColor>
          Description ({detail.commentsCount} comments)
        </Text>
      ),
    });

    const rendered = renderMarkdown(detail.body);
    const bodyLines = rendered.split("\n");
    bodyLines.forEach((line, i) => {
      lines.push({
        key: `body-${i}`,
        node: <Text>{line}</Text>,
      });
    });

    lines.push({ key: "spacer3", node: <Text> </Text> });

    if (detail.checks.length > 0) {
      lines.push({
        key: "checks-header",
        node: (
          <Text bold dimColor>
            Checks ({detail.checks.length})
          </Text>
        ),
      });
      detail.checks.forEach((check, i) => {
        const { icon, color } = getCheckIcon(check);
        const name = check.name || check.context || "unknown";
        lines.push({
          key: `check-${i}`,
          node: (
            <Text>
              {"  "}
              <Text color={color as any}>{icon}</Text> {name}
            </Text>
          ),
        });
      });
      lines.push({ key: "spacer4", node: <Text> </Text> });
    }

    if (detail.reviews.length > 0) {
      lines.push({
        key: "reviews-header",
        node: (
          <Text bold dimColor>
            Reviews
          </Text>
        ),
      });
      detail.reviews.forEach((review, i) => {
        const stateIcon =
          review.state === "APPROVED"
            ? "✓"
            : review.state === "CHANGES_REQUESTED"
              ? "✗"
              : "●";
        const stateColor =
          review.state === "APPROVED"
            ? getTheme().status.success
            : review.state === "CHANGES_REQUESTED"
              ? getTheme().status.failure
              : getTheme().status.pending;
        lines.push({
          key: `review-${i}`,
          node: (
            <Text>
              {"  "}
              <Text color={stateColor as any}>{stateIcon}</Text>{" "}
              {review.author.login}{" "}
              <Text dimColor>
                ({review.state.toLowerCase().replace("_", " ")})
              </Text>
            </Text>
          ),
        });
      });
    }
  }

  return lines;
}
