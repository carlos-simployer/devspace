import React, { useState, useMemo } from "react";
import { Box, Text } from "ink";
import type { JiraIssue } from "../../../api/types.ts";
import { useShortcuts } from "../../../hooks/use-shortcuts.ts";
import { useView } from "../../../ui/view-context.ts";
import { TabItem } from "../../../ui/tab-item.tsx";
import { buildOverviewLines } from "./overview-tab.tsx";
import { buildCommentsLines } from "./comments-tab.tsx";
import { buildSubtasksLines } from "./subtasks-tab.tsx";

type DetailTab = "overview" | "comments" | "subtasks";

interface Props {
  issue: JiraIssue;
  detailIssue: JiraIssue | null;
  detailLoading: boolean;
  detailError: string | null;
  height: number;
  width: number;
  onOpenInBrowser: (url: string) => void;
  jiraSite: string;
}

export function IssueDetail({
  issue,
  detailIssue,
  detailLoading,
  detailError,
  height,
  width,
  onOpenInBrowser,
  jiraSite,
}: Props) {
  const { setView } = useView();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [scrollOffset, setScrollOffset] = useState(0);

  const contentWidth = Math.min(width - 4, 120);

  // Use detail issue if available (has full data), fall back to list issue
  const displayIssue = detailIssue ?? issue;

  const overviewLines = useMemo(
    () => buildOverviewLines(displayIssue, detailLoading, detailError),
    [displayIssue, detailLoading, detailError],
  );

  const commentsLines = useMemo(
    () => buildCommentsLines(displayIssue),
    [displayIssue],
  );

  const subtasksLines = useMemo(
    () => buildSubtasksLines(displayIssue),
    [displayIssue],
  );

  const lines =
    tab === "overview"
      ? overviewLines
      : tab === "comments"
        ? commentsLines
        : subtasksLines;

  const tabBarLines = 2;
  const footerLines = 1;
  const viewportHeight = height - 2 - tabBarLines - footerLines;
  const maxScroll = Math.max(0, lines.length - viewportHeight);

  useShortcuts(
    {
      close: () => setView("jira"),
      open: () => {
        onOpenInBrowser(`https://${jiraSite}/browse/${issue.key}`);
      },
      overviewTab: () => {
        setTab("overview");
        setScrollOffset(0);
      },
      commentsTab: () => {
        setTab("comments");
        setScrollOffset(0);
      },
      subtasksTab: () => {
        setTab("subtasks");
        setScrollOffset(0);
      },
      up: () => setScrollOffset((s) => Math.max(0, s - 1)),
      down: () => setScrollOffset((s) => Math.min(maxScroll, s + 1)),
    },
    { scope: "jira.detail" },
  );

  const actualOffset = Math.min(scrollOffset, maxScroll);
  const visibleLines = lines.slice(actualOffset, actualOffset + viewportHeight);

  const commentCount = displayIssue.fields.comment?.comments?.length ?? 0;
  const subtaskCount = displayIssue.fields.subtasks?.length ?? 0;

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
        <TabItem label="d Details" isActive={tab === "overview"} />
        <Text> </Text>
        <TabItem
          label={`c Comments${commentCount > 0 ? ` (${commentCount})` : ""}`}
          isActive={tab === "comments"}
        />
        <Text> </Text>
        <TabItem
          label={`s Subtasks${subtaskCount > 0 ? ` (${subtaskCount})` : ""}`}
          isActive={tab === "subtasks"}
        />
      </Box>
      <Text dimColor>{"\u2500".repeat(contentWidth)}</Text>

      {/* Content */}
      {visibleLines.map((line) => (
        <Box key={line.key}>{line.node}</Box>
      ))}

      {/* Footer */}
      <Box position="absolute" marginTop={height - 2} marginLeft={2}>
        <Text dimColor>
          {"\u2191\u2193"}: scroll | Esc: close | o: browser | d/c/s: switch tab
        </Text>
      </Box>
    </Box>
  );
}
