import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { PullRequest } from "../api/types.ts";
import type { PRDetail, CheckContext } from "../hooks/use-pr-detail.ts";
import { relativeTime } from "../utils/time.ts";
import { renderMarkdown } from "../utils/markdown.ts";

interface Props {
  pr: PullRequest;
  detail: PRDetail | null;
  loading: boolean;
  error: string | null;
  height: number;
  width: number;
  onClose: () => void;
  onOpenInBrowser: (url: string) => void;
}

function getCheckIcon(check: CheckContext): { icon: string; color: string } {
  if (check.conclusion) {
    switch (check.conclusion) {
      case "SUCCESS":
        return { icon: "✓", color: "green" };
      case "FAILURE":
        return { icon: "✗", color: "red" };
      case "NEUTRAL":
      case "SKIPPED":
        return { icon: "—", color: "gray" };
      default:
        return { icon: "●", color: "yellow" };
    }
  }
  if (check.state) {
    switch (check.state) {
      case "SUCCESS":
        return { icon: "✓", color: "green" };
      case "FAILURE":
      case "ERROR":
        return { icon: "✗", color: "red" };
      case "PENDING":
      case "EXPECTED":
        return { icon: "●", color: "yellow" };
      default:
        return { icon: "—", color: "gray" };
    }
  }
  return { icon: "●", color: "yellow" };
}

export function PRDetailPanel({
  pr,
  detail,
  loading,
  error,
  height,
  width,
  onClose,
  onOpenInBrowser,
}: Props) {
  const [scrollOffset, setScrollOffset] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (input === "o") {
      onOpenInBrowser(pr.url);
      return;
    }
    if (key.upArrow) {
      setScrollOffset((s) => Math.max(0, s - 1));
    }
    if (key.downArrow) {
      setScrollOffset((s) => s + 1);
    }
  });

  const contentWidth = Math.min(width - 4, 100);
  const labels = pr.labels?.nodes ?? [];
  const mergeStatus =
    pr.mergeable === "CONFLICTING"
      ? "Conflicts"
      : pr.mergeable === "MERGEABLE"
        ? "Mergeable"
        : "Unknown";

  // Build content lines
  const lines: Array<{ key: string; node: React.ReactNode }> = [];

  lines.push({
    key: "title",
    node: (
      <Text bold color="cyan">
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
        <Text>{pr.author.login}</Text>
        <Text dimColor> │ Branch: </Text>
        <Text color="cyan">{pr.headRefName}</Text>
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
          <Text color="yellow">Draft</Text>
        ) : (
          <Text color="green">Ready</Text>
        )}
      </Text>
    ),
  });

  lines.push({
    key: "meta3",
    node: (
      <Text>
        <Text dimColor>Merge: </Text>
        <Text color={pr.mergeable === "CONFLICTING" ? "red" : "green"}>
          {mergeStatus}
        </Text>
        <Text dimColor> │ Diff: </Text>
        <Text color="green">+{pr.additions}</Text>
        <Text dimColor> </Text>
        <Text color="red">-{pr.deletions}</Text>
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
      node: <Text color="yellow">Loading details...</Text>,
    });
  } else if (error) {
    lines.push({
      key: "error",
      node: <Text color="red">Error: {error}</Text>,
    });
  } else if (detail) {
    // Description
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

    // Checks
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

    // Reviews
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
            ? "green"
            : review.state === "CHANGES_REQUESTED"
              ? "red"
              : "yellow";
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

  // Viewport window for scrolling
  const viewportHeight = height - 4;
  const maxScroll = Math.max(0, lines.length - viewportHeight);
  const actualOffset = Math.min(scrollOffset, maxScroll);
  const visibleLines = lines.slice(actualOffset, actualOffset + viewportHeight);

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
      paddingY={1}
    >
      {visibleLines.map((line) => (
        <Box key={line.key}>{line.node}</Box>
      ))}
      <Box position="absolute" marginTop={height - 2} marginLeft={2}>
        <Text dimColor>Esc: close │ o: open in browser │ ↑↓: scroll</Text>
      </Box>
    </Box>
  );
}
