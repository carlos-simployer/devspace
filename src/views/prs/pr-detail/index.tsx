import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import type { PullRequest } from "../../../api/types.ts";
import type { PRDetail } from "../../../hooks/use-pr-detail.ts";
import { getChangeTypeIcon } from "../../../utils/status.ts";
import { TabItem } from "../../../ui/tab-item.tsx";
import { useAppContext } from "../../../app-context.ts";
import { useRouter } from "../../../ui/router.ts";
import { openInBrowser } from "../../../utils/browser.ts";
import { usePrsContext } from "../prs-context.ts";
import { buildOverviewLines } from "./overview-tab.tsx";
import { buildFilesLines, findFileRow } from "./files-tab.tsx";

type DetailTab = "overview" | "files";

/**
 * PRDetailPanel — renders the PR detail view.
 * Reads PR data from PrsContext (no props needed when used as a route child).
 */
export function PRDetailPanel() {
  const { height, width } = useAppContext();
  const { navigate } = useRouter();
  const {
    selectedPR: pr,
    prDetail: detail,
    detailLoading: loading,
    detailError: error,
  } = usePrsContext();

  const [tab, setTab] = useState<DetailTab>("overview");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);
  const [expandedFile, setExpandedFile] = useState<number | null>(null);

  // Header height (same as PrsLayout header: ~3 lines)
  const sharedHeaderHeight = 3;
  const panelHeight = height - sharedHeaderHeight;

  const contentWidth = Math.min(width - 4, 120);
  const files = detail?.files ?? [];

  const overviewLines = useMemo(
    () => (pr ? buildOverviewLines(pr, detail, loading, error) : []),
    [pr, detail, loading, error],
  );

  const filesLines = useMemo(
    () => buildFilesLines(files, expandedFile, contentWidth),
    [files, expandedFile, contentWidth],
  );

  const lines = tab === "overview" ? overviewLines : filesLines;

  const tabBarLines = 2;
  const footerLines = 1;
  const viewportHeight = panelHeight - 2 - tabBarLines - footerLines;
  const maxScroll = Math.max(0, lines.length - viewportHeight);

  useInput((input, key) => {
    if (!pr) return;

    // When diff is expanded, Escape collapses it instead of closing panel
    if (key.escape) {
      if (tab === "files" && expandedFile !== null) {
        const row = findFileRow(filesLines, expandedFile);
        setExpandedFile(null);
        if (row >= 0) setScrollOffset(Math.max(0, row - 2));
        return;
      }
      navigate("prs");
      return;
    }
    if (input === "o") {
      openInBrowser(pr.url);
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
      // When a diff is expanded, up/down scrolls the content
      if (expandedFile !== null) {
        if (key.upArrow) {
          setScrollOffset((s) => Math.max(0, s - 1));
          return;
        }
        if (key.downArrow) {
          setScrollOffset((s) => Math.min(maxScroll, s + 1));
          return;
        }
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

  if (!pr) return null;

  const actualOffset = Math.min(scrollOffset, maxScroll);
  const visibleLines = lines.slice(actualOffset, actualOffset + viewportHeight);

  const selectedFileKey = `file-${fileIndex}`;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={panelHeight}
      paddingX={2}
      paddingY={1}
    >
      {/* Tab bar */}
      <Box>
        <TabItem label="d Overview" isActive={tab === "overview"} />
        <Text> </Text>
        <TabItem
          label={`f Files${files.length > 0 ? ` (${files.length})` : ""}`}
          isActive={tab === "files"}
        />
      </Box>
      <Text dimColor>{"─".repeat(contentWidth)}</Text>

      {/* Content */}
      {visibleLines.map((line) => (
        <Box key={line.key}>
          {tab === "files" && line.key === selectedFileKey ? (
            <Text inverse bold>
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
      <Box position="absolute" marginTop={panelHeight - 2} marginLeft={2}>
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
