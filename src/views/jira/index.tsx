import React, { useState, useMemo, useRef, useEffect } from "react";
import { Box, Text, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { Config, JiraFilterMode } from "../../api/types.ts";
import { useView } from "../../ui/view-context.ts";
import { useShortcuts } from "../../hooks/use-shortcuts.ts";
import { useJiraIssues } from "../../hooks/use-jira-issues.ts";
import { useJiraIssueDetail } from "../../hooks/use-jira-issue-detail.ts";
import { getTheme } from "../../ui/theme.ts";
import { HelpOverlay } from "../../components/help-overlay.tsx";
import { ViewHeader } from "../../components/view-header.tsx";
import { IssueList } from "./issue-list.tsx";
import { JiraStatusBar } from "./status-bar.tsx";
import { MemberSelect } from "./member-select.tsx";
import { IssueDetail } from "./issue-detail/index.tsx";

interface Props {
  config: Config;
  height: number;
  width: number;
  onQuit: () => void;
}

const DEFAULT_STATUS_ORDER = [
  "In Progress",
  "Blocked",
  "In Review",
  "Ready for Test",
  "To Do",
  "Done",
];

export function JiraView({ config, height, width, onQuit }: Props) {
  const { view, setView } = useView();

  // Derive sub-view state from view context
  const showHelp = view === "jira.help";
  const showDetail = view === "jira.detail";
  const showMemberSelect = view === "jira.memberSelect";

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<JiraFilterMode>("mine");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  const isConfigured =
    !!config.jiraSite && !!config.jiraEmail && !!config.jiraToken;

  const { issues, loading, error, refetch } = useJiraIssues(
    config,
    filterMode,
    filterAccountId || undefined,
  );

  const statusOrder =
    config.jiraStatusOrder?.length > 0
      ? config.jiraStatusOrder
      : DEFAULT_STATUS_ORDER;

  // Filter issues by search text for the flat list (IssueList also filters,
  // but we need the filtered count for selectedIndex clamping)
  const filteredIssues = useMemo(() => {
    if (!searchText) return issues;
    return issues.filter(
      (issue) =>
        issue.fields.summary.toLowerCase().includes(searchText.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [issues, searchText]);

  // Clamp selectedIndex to valid range
  useEffect(() => {
    if (filteredIssues.length > 0 && selectedIndex >= filteredIssues.length) {
      setSelectedIndex(Math.max(0, filteredIssues.length - 1));
    }
  }, [filteredIssues.length, selectedIndex]);

  const selectedIssue = filteredIssues[selectedIndex] ?? null;

  // Fetch detail for selected issue when detail panel is open
  const {
    issue: detailIssue,
    loading: detailLoading,
    error: detailError,
  } = useJiraIssueDetail(
    config,
    showDetail ? (selectedIssue?.key ?? null) : null,
  );

  // Layout measurement
  const headerRef = useRef<DOMElement>(null);
  const statusRef = useRef<DOMElement>(null);
  const [measuredHeader, setMeasuredHeader] = useState(4);
  const [measuredStatus, setMeasuredStatus] = useState(3);

  useEffect(() => {
    if (headerRef.current) {
      setMeasuredHeader(measureElement(headerRef.current).height);
    }
    if (statusRef.current) {
      setMeasuredStatus(measureElement(statusRef.current).height);
    }
  });

  const openInBrowser = async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  };

  useShortcuts(
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
          setView("jira.detail");
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
        setView("jira.memberSelect");
      },
      search: () => {
        setSearchMode(true);
        setSearchText("");
      },
      refresh: () => {
        refetch();
      },
      up: () => {
        setSelectedIndex((i) => Math.max(0, i - 1));
      },
      down: () => {
        setSelectedIndex((i) => Math.min(filteredIssues.length - 1, i + 1));
      },
      clearSearch: () => {
        if (searchText) {
          setSearchText("");
        }
      },
    },
    {
      onUnhandled: (input, key) => {
        // Search mode — raw text entry, bypass shortcut matching
        if (searchMode) {
          if (key.escape) {
            setSearchMode(false);
            setSearchText("");
            return;
          }
          if (key.backspace || key.delete) {
            setSearchText((s) => s.slice(0, -1));
            return;
          }
          if (key.return) {
            setSearchMode(false);
            return;
          }
          if (input && !key.ctrl && !key.meta) {
            setSearchText((s) => s + input);
            return;
          }
        }
      },
    },
  );

  // Height of the shared header (TabBar + Shortcuts + border)
  const sharedHeaderHeight = 3;

  if (!isConfigured) {
    return (
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader view={view} />
        <Box
          flexGrow={1}
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Text bold color={getTheme().status.pending}>
            Jira not configured
          </Text>
          <Text dimColor>
            Press 7 to open Config and set up Jira credentials.
          </Text>
        </Box>
      </Box>
    );
  }

  if (showHelp) {
    return (
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader view={view} />
        <HelpOverlay
          height={height - sharedHeaderHeight}
          width={width}
          view="jira"
        />
      </Box>
    );
  }

  if (showDetail && selectedIssue) {
    return (
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader view={view} />
        <IssueDetail
          issue={selectedIssue}
          detailIssue={detailIssue}
          detailLoading={detailLoading}
          detailError={detailError}
          height={height - sharedHeaderHeight}
          width={width}
          onOpenInBrowser={openInBrowser}
          jiraSite={config.jiraSite}
        />
      </Box>
    );
  }

  const mainHeight = Math.max(1, height - measuredHeader - measuredStatus);

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Tab bar + Header */}
      <Box
        ref={headerRef}
        width={width}
        flexDirection="column"
        paddingX={1}
        borderStyle="single"
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderBottom
      >
        <ViewHeader view={view} headerRef={undefined} />
      </Box>

      {/* Main issue list */}
      <Box flexGrow={1} height={mainHeight}>
        <IssueList
          issues={filteredIssues}
          statusOrder={statusOrder}
          selectedIndex={selectedIndex}
          height={mainHeight}
          width={width}
          searchText={searchMode ? searchText : ""}
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
          fetching={loading}
          searchText={searchMode ? searchText : ""}
          error={error}
        />
      </Box>

      {/* Member select overlay */}
      {showMemberSelect && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 15) / 2)}
        >
          <MemberSelect
            onSelect={(accountId) => {
              setFilterAccountId(accountId);
              setFilterMode("person");
              setSelectedIndex(0);
              setView("jira");
            }}
            onClose={() => setView("jira")}
            height={height}
            width={width}
          />
        </Box>
      )}
    </Box>
  );
}
