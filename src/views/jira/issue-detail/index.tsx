import React, { useState, useMemo } from "react";
import { Box, Text } from "ink";
import { useRouteShortcuts } from "../../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../../ui/router.ts";
import { useAppContext } from "../../../app-context.ts";
import { useJiraContext } from "../jira-context.ts";
import { openInBrowser } from "../../../utils/browser.ts";
import { DetailPanel } from "../../../ui/detail-panel.tsx";
import type { ContentLine, DetailTab } from "../../../ui/detail-panel.tsx";
import { buildOverviewLines } from "./overview-tab.tsx";
import { buildCommentsLines } from "./comments-tab.tsx";
import { buildSubtasksLines } from "./subtasks-tab.tsx";

type IssueDetailTab = "overview" | "comments" | "subtasks";

export function IssueDetail() {
  const { navigate } = useRouter();
  const { config, contentHeight: height, width } = useAppContext();
  const { selectedIssue, detailIssue, detailLoading, detailError } =
    useJiraContext();
  const [tab, setTab] = useState<IssueDetailTab>("overview");
  const [scrollOffset, setScrollOffset] = useState(0);

  const jiraSite = config.jiraSite;
  const issue = selectedIssue;

  // Use detail issue if available (has full data), fall back to list issue
  const displayIssue = detailIssue ?? issue;

  const overviewLines: ContentLine[] = useMemo(
    () =>
      displayIssue
        ? buildOverviewLines(displayIssue, detailLoading, detailError)
        : [],
    [displayIssue, detailLoading, detailError],
  );

  const commentsLines: ContentLine[] = useMemo(
    () => (displayIssue ? buildCommentsLines(displayIssue) : []),
    [displayIssue],
  );

  const subtasksLines: ContentLine[] = useMemo(
    () => (displayIssue ? buildSubtasksLines(displayIssue) : []),
    [displayIssue],
  );

  const lines =
    tab === "overview"
      ? overviewLines
      : tab === "comments"
        ? commentsLines
        : subtasksLines;

  const maxScroll = Math.max(0, lines.length - (height - 6));

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

  const commentCount = displayIssue.fields.comment?.comments?.length ?? 0;
  const subtaskCount = displayIssue.fields.subtasks?.length ?? 0;

  const tabs: DetailTab[] = [
    { id: "overview", label: `d Details` },
    {
      id: "comments",
      label: `c Comments${commentCount > 0 ? ` (${commentCount})` : ""}`,
    },
    {
      id: "subtasks",
      label: `s Subtasks${subtaskCount > 0 ? ` (${subtaskCount})` : ""}`,
    },
  ];

  return (
    <DetailPanel
      tabs={tabs}
      activeTab={tab}
      lines={lines}
      scrollOffset={scrollOffset}
      height={height}
      width={width}
      footer={
        "\u2191\u2193: scroll | Esc: close | o: browser | d/c/s: switch tab"
      }
    />
  );
}
