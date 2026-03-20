import React, { useState, useMemo, useEffect } from "react";
import { Box, Text } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { getToken } from "../../utils/tokens.ts";
import { useRouter, Outlet, useOutlet } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useJiraIssues } from "../../hooks/use-jira-issues.ts";
import { useJiraIssueDetail } from "../../hooks/use-jira-issue-detail.ts";
import { getTheme } from "../../ui/theme.ts";
import { FocusProvider } from "../../ui/focus.ts";
import { groupByStatus, sortIssuesInGroups } from "../../utils/jira-status.ts";
import { JiraContext, type JiraContextValue } from "./jira-context.ts";
import { JiraIssueListView } from "./issue-list-view.tsx";
import { jiraStore } from "./jira-store.ts";

const DEFAULT_STATUS_ORDER = [
  "In Progress",
  "Blocked",
  "In Review",
  "Ready for Test",
  "To Do",
  "Done",
];

export function JiraLayout() {
  const { config, contentHeight: height, width, onQuit } = useAppContext();
  const { route } = useRouter();
  const outlet = useOutlet();

  // Enables tab switching, number keys, quit even on "not configured" screen.
  useRouteShortcuts({ quit: onQuit });

  const statusOrder =
    config.jiraStatusOrder?.length > 0
      ? config.jiraStatusOrder
      : DEFAULT_STATUS_ORDER;

  // Persisted state (survives tab switches)
  const {
    selectedIndex,
    setSelectedIndex,
    filterMode,
    setFilterMode,
    filterAccountIds,
    setFilterAccountIds,
    sortFields,
    setSortFields,
    enabledStatuses,
    setEnabledStatuses,
    initialize: initializeStore,
  } = useStore(jiraStore);
  // Initialize enabledStatuses from config on first mount
  initializeStore(statusOrder);
  // Transient state (resets on tab switch)
  const [searchText, setSearchText] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  const jiraToken = getToken("jiraToken");
  const isConfigured = !!config.jiraSite && !!config.jiraEmail && !!jiraToken;

  const { issues, loading, fetching, error, refetch } = useJiraIssues(
    config,
    filterMode,
    filterAccountIds.size > 0 ? filterAccountIds : undefined,
  );

  const allStatusesEnabled = enabledStatuses.size === statusOrder.length;

  // Filter + reorder by status groups so selectedIndex matches display order
  const filteredIssues = useMemo(() => {
    let filtered = issues;
    // Status filter
    if (!allStatusesEnabled) {
      filtered = filtered.filter((issue) =>
        enabledStatuses.has(issue.fields.status.name),
      );
    }
    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (issue) =>
          issue.fields.summary
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          issue.key.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
    // Group by status, sort within groups, flatten
    const groups = groupByStatus(filtered, statusOrder);
    const sorted = sortIssuesInGroups(groups, sortFields);
    return sorted.flatMap((g) => g.issues);
  }, [
    issues,
    searchText,
    statusOrder,
    enabledStatuses,
    allStatusesEnabled,
    sortFields,
  ]);

  // Clamp selectedIndex to valid range
  useEffect(() => {
    if (filteredIssues.length > 0 && selectedIndex >= filteredIssues.length) {
      setSelectedIndex(Math.max(0, filteredIssues.length - 1));
    }
  }, [filteredIssues.length, selectedIndex]);

  const selectedIssue = filteredIssues[selectedIndex] ?? null;

  // Fetch detail for selected issue when detail panel is open
  const showDetail = route.startsWith("jira/detail/");
  const {
    issue: detailIssue,
    loading: detailLoading,
    error: detailError,
  } = useJiraIssueDetail(
    config,
    showDetail ? (selectedIssue?.key ?? null) : null,
  );

  if (!isConfigured) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Text bold color={getTheme().status.pending}>
          Jira not configured
        </Text>
        <Text dimColor>
          Press 8 to open Config and set up Jira credentials.
        </Text>
      </Box>
    );
  }

  const ctx: JiraContextValue = {
    selectedIndex,
    setSelectedIndex,
    selectedIssue,
    filteredIssues,
    filterMode,
    setFilterMode,
    filterAccountIds,
    setFilterAccountIds,
    enabledStatuses,
    setEnabledStatuses,
    searchText,
    searchMode,
    setSearchMode,
    setSearchText,
    sortFields,
    setSortFields,
    statusOrder,
    allStatusesEnabled,
    issues,
    loading,
    fetching,
    error,
    refetch,
    detailIssue,
    detailLoading,
    detailError,
  };

  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus="list">
      <JiraContext.Provider value={ctx}>
        <Box height={height} width={width}>
          {/* Main content layer — always show index view */}
          <Box height={height} width={width} flexDirection="column">
            {isOverlay ? <JiraIssueListView /> : <Outlet />}
          </Box>

          {/* Overlay layer — dialog on top */}
          {isOverlay && (
            <Box
              position="absolute"
              width={width}
              height={height}
              alignItems="center"
              justifyContent="center"
            >
              <Outlet />
            </Box>
          )}
        </Box>
      </JiraContext.Provider>
    </FocusProvider>
  );
}
