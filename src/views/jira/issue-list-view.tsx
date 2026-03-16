import React, { useRef, useState, useEffect } from "react";
import { Box, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { SORT_FIELD_LABELS } from "../../utils/jira-status.ts";
import { useJiraContext } from "./jira-context.ts";
import { IssueList } from "./issue-list.tsx";
import { JiraStatusBar } from "./status-bar.tsx";

export function JiraIssueListView() {
  const { config, contentHeight: height, width, onQuit } = useAppContext();
  const { route, navigate } = useRouter();
  const {
    selectedIndex,
    setSelectedIndex,
    selectedIssue,
    filteredIssues,
    filterMode,
    setFilterMode,
    searchText,
    searchMode,
    setSearchMode,
    setSearchText,
    sortFields,
    allStatusesEnabled,
    statusOrder,
    loading,
    fetching,
    error,
    refetch,
  } = useJiraContext();

  // Layout measurement
  const statusRef = useRef<DOMElement>(null);
  const [measuredStatus, setMeasuredStatus] = useState(3);

  useEffect(() => {
    if (statusRef.current) {
      const h = measureElement(statusRef.current).height;
      setMeasuredStatus((prev) => (prev === h ? prev : h));
    }
  });

  // Search mode captures all input before useRouteShortcuts can match
  const searchJustActivated = useRef(false);
  useInput(
    (input, key) => {
      // Skip the "/" character that triggered search mode
      if (searchJustActivated.current) {
        searchJustActivated.current = false;
        if (input === "/") return;
      }
      if (key.escape) {
        setSearchMode(false);
        setSearchText("");
        return;
      }
      if (key.upArrow) {
        setSelectedIndex((i: number) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i: number) =>
          Math.min(filteredIssues.length - 1, i + 1),
        );
        return;
      }
      if (key.return) {
        if (selectedIssue) {
          navigate(`jira/detail/${selectedIssue.key}`);
        }
        return;
      }
      if (key.backspace || key.delete) {
        setSearchText((s: string) => s.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchText((s: string) => s + input);
      }
    },
    {
      isActive: searchMode && route === "jira",
    },
  );

  const isMainView = route === "jira";

  useRouteShortcuts(
    {
      quit: onQuit,
      open: () => {
        if (selectedIssue) {
          openInBrowser(
            `https://${config.jiraSite}/browse/${selectedIssue.key}`,
          );
        }
      },
      detail: () => {
        if (selectedIssue) {
          navigate(`jira/detail/${selectedIssue.key}`);
        }
      },
      filterMine: () => {
        setFilterMode("mine");
        setSelectedIndex(0);
      },
      filterTeam: () => {
        setFilterMode("team");
        setSelectedIndex(0);
      },
      filterPerson: () => {
        navigate("jira/memberSelect");
      },
      filterStatus: () => {
        navigate("jira/statusFilter");
      },
      sort: () => {
        navigate("jira/sort");
      },
      search: () => {
        searchJustActivated.current = true;
        setSearchMode(true);
        setSearchText("");
      },
      refresh: () => {
        refetch();
      },
      up: () => {
        setSelectedIndex((i: number) => Math.max(0, i - 1));
      },
      down: () => {
        setSelectedIndex((i: number) =>
          Math.min(filteredIssues.length - 1, i + 1),
        );
      },
      clearSearch: () => {
        if (searchText) {
          setSearchText("");
        }
      },
    },
    { active: !searchMode && isMainView },
  );

  const mainHeight = Math.max(1, height - measuredStatus);

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main issue list */}
      <Box flexGrow={1} height={mainHeight}>
        <IssueList
          issues={filteredIssues}
          statusOrder={statusOrder}
          selectedIndex={selectedIndex}
          height={mainHeight}
          width={width}
          searchText={searchMode ? searchText : null}
          loading={loading}
        />
      </Box>

      {/* Status bar */}
      <Box ref={statusRef} flexDirection="column">
        <JiraStatusBar
          filterMode={filterMode}
          projectKey={config.jiraProject}
          issueCount={filteredIssues.length}
          selectedIssue={selectedIssue}
          width={width}
          fetching={fetching}
          searchText={searchMode ? searchText : null}
          statusFilterActive={!allStatusesEnabled}
          sortLabel={sortFields.map((f) => SORT_FIELD_LABELS[f]).join(" > ")}
          error={error}
        />
      </Box>
    </Box>
  );
}
