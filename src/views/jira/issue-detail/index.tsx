import React, { useState, useMemo } from "react";
import { Box, Text } from "ink";
import { useRouteShortcuts } from "../../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../../ui/router.ts";
import { useAppContext } from "../../../app-context.ts";
import { useJiraContext } from "../jira-context.ts";
import { openInBrowser } from "../../../utils/browser.ts";
import { TabItem } from "../../../ui/tab-item.tsx";
import { buildOverviewLines } from "./overview-tab.tsx";
import { buildCommentsLines } from "./comments-tab.tsx";
import { buildSubtasksLines } from "./subtasks-tab.tsx";

type DetailTab = "overview" | "comments" | "subtasks";

export function IssueDetail() {
  const { navigate } = useRouter();
  const { config, contentHeight: height, width } = useAppContext();
  const { selectedIssue, detailIssue, detailLoading, detailError } =
    useJiraContext();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [scrollOffset, setScrollOffset] = useState(0);

  const jiraSite = config.jiraSite;
  const issue = selectedIssue;

  const contentWidth = Math.min(width - 4, 120);

  // Use detail issue if available (has full data), fall back to list issue
  const displayIssue = detailIssue ?? issue;

  const overviewLines = useMemo(
    () =>
      displayIssue
        ? buildOverviewLines(displayIssue, detailLoading, detailError)
        : [],
    [displayIssue, detailLoading, detailError],
  );

  const commentsLines = useMemo(
    () => (displayIssue ? buildCommentsLines(displayIssue) : []),
    [displayIssue],
  );

  const subtasksLines = useMemo(
    () => (displayIssue ? buildSubtasksLines(displayIssue) : []),
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

  useRouteShortcuts({
    close: () => navigate("jira"),
    open: () => {
      if (issue) {
        openInBrowser(`https://${jiraSite}/browse/${issue.key}`);
      }
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
  });

  if (!issue || !displayIssue) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <Text dimColor>No issue selected</Text>
      </Box>
    );
  }

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
