import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import type { PullRequest } from "../api/types.ts";
import type { PRDetail, CheckContext, PRFile } from "../hooks/use-pr-detail.ts";
import { relativeTime } from "../utils/time.ts";
import { renderMarkdown } from "../utils/markdown.ts";

type DetailTab = "overview" | "files";

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

function getChangeTypeIcon(changeType: string): {
  icon: string;
  color: string;
} {
  switch (changeType) {
    case "ADDED":
      return { icon: "A", color: "green" };
    case "DELETED":
      return { icon: "D", color: "red" };
    case "RENAMED":
      return { icon: "R", color: "yellow" };
    case "COPIED":
      return { icon: "C", color: "cyan" };
    default:
      return { icon: "M", color: "yellow" };
  }
}

function buildOverviewLines(
  pr: PullRequest,
  detail: PRDetail | null,
  loading: boolean,
  error: string | null,
): Array<{ key: string; node: React.ReactNode }> {
  const lines: Array<{ key: string; node: React.ReactNode }> = [];

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
        <Text>{pr.author.name || pr.author.login}</Text>
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

  return lines;
}

function buildFilesLines(
  files: PRFile[],
  expandedFile: number | null,
  contentWidth: number,
): Array<{ key: string; node: React.ReactNode }> {
  const lines: Array<{ key: string; node: React.ReactNode }> = [];

  lines.push({
    key: "files-header",
    node: (
      <Text bold dimColor>
        Changed files ({files.length})
      </Text>
    ),
  });

  lines.push({ key: "files-spacer", node: <Text> </Text> });

  files.forEach((file, i) => {
    const { icon, color } = getChangeTypeIcon(file.changeType);
    const isExpanded = expandedFile === i;
    const arrow = isExpanded ? "▼" : "▶";

    lines.push({
      key: `file-${i}`,
      node: (
        <Text>
          <Text color={isExpanded ? "cyan" : undefined}>
            {isExpanded ? "> " : "  "}
          </Text>
          <Text color={color as any}>{icon}</Text>
          {"  "}
          <Text bold={isExpanded}>{file.path}</Text>
          {"  "}
          <Text color="green">+{file.additions}</Text>
          <Text dimColor> </Text>
          <Text color="red">-{file.deletions}</Text>
          {"  "}
          <Text dimColor>{arrow}</Text>
        </Text>
      ),
    });

    if (isExpanded && file.patch) {
      lines.push({ key: `file-${i}-sep`, node: <Text> </Text> });
      const patchLines = file.patch.split("\n");
      patchLines.forEach((patchLine, j) => {
        const truncated =
          patchLine.length > contentWidth - 4
            ? patchLine.slice(0, contentWidth - 5) + "…"
            : patchLine;

        let color: string | undefined;
        if (patchLine.startsWith("@@")) {
          color = "cyan";
        } else if (patchLine.startsWith("+")) {
          color = "green";
        } else if (patchLine.startsWith("-")) {
          color = "red";
        }

        lines.push({
          key: `file-${i}-patch-${j}`,
          node: (
            <Text>
              {"    "}
              <Text color={color as any}>{truncated}</Text>
            </Text>
          ),
        });
      });
      lines.push({ key: `file-${i}-end`, node: <Text> </Text> });
    } else if (isExpanded && !file.patch) {
      lines.push({
        key: `file-${i}-nopatch`,
        node: (
          <Text>
            {"    "}
            <Text dimColor>(binary file or no diff available)</Text>
          </Text>
        ),
      });
      lines.push({ key: `file-${i}-end`, node: <Text> </Text> });
    }
  });

  return lines;
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
  const [tab, setTab] = useState<DetailTab>("overview");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);
  const [expandedFile, setExpandedFile] = useState<number | null>(null);

  const contentWidth = Math.min(width - 4, 120);
  const files = detail?.files ?? [];

  const overviewLines = useMemo(
    () => buildOverviewLines(pr, detail, loading, error),
    [pr, detail, loading, error],
  );

  const filesLines = useMemo(
    () => buildFilesLines(files, expandedFile, contentWidth),
    [files, expandedFile, contentWidth],
  );

  const lines = tab === "overview" ? overviewLines : filesLines;

  const tabBarLines = 2;
  const footerLines = 1;
  const viewportHeight = height - 2 - tabBarLines - footerLines;
  const maxScroll = Math.max(0, lines.length - viewportHeight);

  useInput((input, key) => {
    // When diff is expanded, Escape collapses it instead of closing panel
    if (key.escape) {
      if (tab === "files" && expandedFile !== null) {
        const row = findFileRow(filesLines, expandedFile);
        setExpandedFile(null);
        if (row >= 0) setScrollOffset(Math.max(0, row - 2));
        return;
      }
      onClose();
      return;
    }
    if (input === "o") {
      onOpenInBrowser(pr.url);
      return;
    }

    // Tab switching
    if (input === "f") {
      setTab("files");
      setScrollOffset(0);
      return;
    }
    if (input === "d") {
      setTab("overview");
      setScrollOffset(0);
      return;
    }
    if (key.tab) {
      setTab((t) => (t === "overview" ? "files" : "overview"));
      setScrollOffset(0);
      return;
    }

    if (tab === "files" && files.length > 0) {
      // When a diff is expanded, ↑/↓ scrolls the content
      if (expandedFile !== null) {
        if (key.upArrow) {
          setScrollOffset((s) => Math.max(0, s - 1));
          return;
        }
        if (key.downArrow) {
          setScrollOffset((s) => Math.min(maxScroll, s + 1));
          return;
        }
        // Enter or Escape collapses back to file list
        if (key.return || key.escape) {
          const row = findFileRow(filesLines, expandedFile);
          setExpandedFile(null);
          if (row >= 0) setScrollOffset(Math.max(0, row - 2));
          return;
        }
        return;
      }

      // File list navigation
      if (key.upArrow) {
        const next = Math.max(0, fileIndex - 1);
        setFileIndex(next);
        const targetRow = findFileRow(filesLines, next);
        if (targetRow >= 0) {
          setScrollOffset((s) => {
            if (targetRow < s) return targetRow;
            if (targetRow >= s + viewportHeight)
              return targetRow - viewportHeight + 1;
            return s;
          });
        }
        return;
      }
      if (key.downArrow) {
        const next = Math.min(files.length - 1, fileIndex + 1);
        setFileIndex(next);
        const targetRow = findFileRow(filesLines, next);
        if (targetRow >= 0) {
          setScrollOffset((s) => {
            if (targetRow < s) return targetRow;
            if (targetRow >= s + viewportHeight)
              return targetRow - viewportHeight + 1;
            return s;
          });
        }
        return;
      }
      if (key.return) {
        setExpandedFile(fileIndex);
        // Scroll so the file header is near the top
        const targetRow = findFileRow(filesLines, fileIndex);
        if (targetRow >= 0) setScrollOffset(Math.max(0, targetRow - 1));
        return;
      }
    } else {
      if (key.upArrow) {
        setScrollOffset((s) => Math.max(0, s - 1));
      }
      if (key.downArrow) {
        setScrollOffset((s) => Math.min(maxScroll, s + 1));
      }
    }
  });

  const actualOffset = Math.min(scrollOffset, maxScroll);
  const visibleLines = lines.slice(actualOffset, actualOffset + viewportHeight);

  // For files tab, highlight the selected file row
  const selectedFileKey = `file-${fileIndex}`;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
      paddingY={1}
    >
      {/* Tab bar */}
      <Box>
        <Text
          backgroundColor={tab === "overview" ? "cyan" : undefined}
          color={tab === "overview" ? "black" : undefined}
          bold={tab === "overview"}
          dimColor={tab !== "overview"}
        >
          {" d Overview "}
        </Text>
        <Text> </Text>
        <Text
          backgroundColor={tab === "files" ? "cyan" : undefined}
          color={tab === "files" ? "black" : undefined}
          bold={tab === "files"}
          dimColor={tab !== "files"}
        >
          {" f Files"}
          {files.length > 0 ? ` (${files.length})` : ""}{" "}
        </Text>
      </Box>
      <Text dimColor>{"─".repeat(contentWidth)}</Text>

      {/* Content */}
      {visibleLines.map((line) => (
        <Box key={line.key}>
          {tab === "files" && line.key === selectedFileKey ? (
            <Text backgroundColor="blue" color="white">
              {/* Re-render the file line with highlight */}
              {(() => {
                const file = files[fileIndex];
                if (!file) return null;
                const { icon, color: _color } = getChangeTypeIcon(
                  file.changeType,
                );
                const isExpanded = expandedFile === fileIndex;
                const arrow = isExpanded ? "▼" : "▶";
                const lineText = `> ${icon}  ${file.path}  +${file.additions} -${file.deletions}  ${arrow}`;
                return lineText;
              })()}
            </Text>
          ) : (
            line.node
          )}
        </Box>
      ))}

      {/* Footer */}
      <Box position="absolute" marginTop={height - 2} marginLeft={2}>
        <Text dimColor>
          {tab === "files" && expandedFile !== null
            ? "↑↓: scroll diff │ Enter/Esc: collapse │ o: browser │ d/f: switch tab"
            : tab === "files"
              ? "↑↓: select file │ Enter: expand diff │ Esc: close │ o: browser │ d/f: switch tab"
              : "↑↓: scroll │ Esc: close │ o: browser │ d/f: switch tab"}
        </Text>
      </Box>
    </Box>
  );
}

/** Find the row index for a given file index in the flat lines array */
function findFileRow(
  lines: Array<{ key: string; node: React.ReactNode }>,
  fileIdx: number,
): number {
  const key = `file-${fileIdx}`;
  return lines.findIndex((l) => l.key === key);
}
