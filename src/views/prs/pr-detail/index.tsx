import React, { useState, useMemo } from "react";
import { Text, useInput } from "ink";
import { DetailPanel, type ContentLine } from "../../../ui/detail-panel.tsx";
import { getChangeTypeIcon } from "../../../utils/status.ts";
import { useAppContext } from "../../../app-context.ts";
import { useRouter } from "../../../ui/router.ts";
import { useRouteShortcuts } from "../../../hooks/use-route-shortcuts.ts";
import { openInBrowser } from "../../../utils/browser.ts";
import { usePrsContext } from "../prs-context.ts";
import { buildOverviewLines } from "./overview-tab.tsx";
import { buildFilesLines, findFileRow } from "./files-tab.tsx";

type DetailTab = "overview" | "files";

/**
 * PRDetailPanel — renders the PR detail view.
 * Reads PR data from PrsContext (no props needed when used as a route child).
 * Uses the generic DetailPanel component for tab bar + scroll structure.
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

  useRouteShortcuts({});

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

  const lines: ContentLine[] = tab === "overview" ? overviewLines : filesLines;

  // DetailPanel computes viewport internally
  const panelBorders = 2;
  const tabBarAndSeparator = 2;
  const footerHeight = 1;
  const viewportHeight =
    panelHeight - panelBorders - tabBarAndSeparator - footerHeight;
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

  const selectedFileKey = `file-${fileIndex}`;

  // Override the file line rendering for the selected file
  const processedLines: ContentLine[] = lines.map((line) => {
    if (tab === "files" && line.key === selectedFileKey) {
      const file = files[fileIndex];
      if (!file) return line;
      const { icon } = getChangeTypeIcon(file.changeType);
      const isExpanded = expandedFile === fileIndex;
      const arrow = isExpanded ? "\u25BC" : "\u25B6";
      const lineText = `> ${icon}  ${file.path}  +${file.additions} -${file.deletions}  ${arrow}`;
      return {
        key: line.key,
        node: (
          <Text inverse bold>
            {lineText}
          </Text>
        ),
      };
    }
    return line;
  });

  const tabs = [
    { id: "overview", label: "d Overview" },
    {
      id: "files",
      label: `f Files${files.length > 0 ? ` (${files.length})` : ""}`,
    },
  ];

  const footerText =
    tab === "files" && expandedFile !== null
      ? "\u2191\u2193: scroll diff \u2502 Enter/Esc: collapse \u2502 o: browser \u2502 d/f: switch tab"
      : tab === "files"
        ? "\u2191\u2193: select file \u2502 Enter: expand diff \u2502 Esc: close \u2502 o: browser \u2502 d/f: switch tab"
        : "\u2191\u2193: scroll \u2502 Esc: close \u2502 o: browser \u2502 d/f: switch tab";

  return (
    <DetailPanel
      tabs={tabs}
      activeTab={tab}
      lines={processedLines}
      scrollOffset={scrollOffset}
      height={panelHeight}
      width={width}
      footer={footerText}
    />
  );
}
