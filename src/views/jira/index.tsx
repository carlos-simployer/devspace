import React, { useState, useMemo, useRef, useEffect } from "react";
import { Box, Text, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { Config, JiraFilterMode } from "../../api/types.ts";
import { useView } from "../../ui/view-context.ts";
import { useShortcuts } from "../../hooks/use-shortcuts.ts";
import { useJiraIssues } from "../../hooks/use-jira-issues.ts";
import { useJiraIssueDetail } from "../../hooks/use-jira-issue-detail.ts";
import { getTheme } from "../../ui/theme.ts";
import {
  groupByStatus,
  sortIssuesInGroups,
  JIRA_SORT_MODES,
  JIRA_SORT_LABELS,
  type JiraSortMode,
} from "../../utils/jira-status.ts";
import { HelpOverlay } from "../../components/help-overlay.tsx";
import { IssueList } from "./issue-list.tsx";
import { JiraStatusBar } from "./status-bar.tsx";
import { MemberSelect } from "./member-select.tsx";
import { StatusFilter } from "./status-filter.tsx";
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
  const showStatusFilter = view === "jira.statusFilter";

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<JiraFilterMode>("mine");
  const [filterAccountIds, setFilterAccountIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchText, setSearchText] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [sortMode, setSortMode] = useState<JiraSortMode>("updated");
  const [enabledStatuses, setEnabledStatuses] = useState<Set<string>>(
    () => new Set(config.jiraStatusOrder),
  );

  const isConfigured =
    !!config.jiraSite && !!config.jiraEmail && !!config.jiraToken;

  const { issues, loading, error, refetch } = useJiraIssues(
    config,
    filterMode,
    filterAccountIds.size > 0 ? filterAccountIds : undefined,
  );

  const statusOrder =
    config.jiraStatusOrder?.length > 0
      ? config.jiraStatusOrder
      : DEFAULT_STATUS_ORDER;

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
    const sorted = sortIssuesInGroups(groups, sortMode);
    return sorted.flatMap((g) => g.issues);
  }, [
    issues,
    searchText,
    statusOrder,
    enabledStatuses,
    allStatusesEnabled,
    sortMode,
  ]);

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
  const statusRef = useRef<DOMElement>(null);
  const [measuredStatus, setMeasuredStatus] = useState(3);

  useEffect(() => {
    if (statusRef.current) {
      setMeasuredStatus(measureElement(statusRef.current).height);
    }
  });

  const openInBrowser = async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  };

  // Search mode captures all input before useShortcuts can match
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
      }
    },
    { isActive: searchMode },
  );

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
      filterStatus: () => {
        setView("jira.statusFilter");
      },
      sort: () => {
        setSortMode((prev) => {
          const idx = JIRA_SORT_MODES.indexOf(prev);
          return JIRA_SORT_MODES[(idx + 1) % JIRA_SORT_MODES.length]!;
        });
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
    { active: !searchMode },
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
          Press 7 to open Config and set up Jira credentials.
        </Text>
      </Box>
    );
  }

  if (showStatusFilter) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <StatusFilter
          statuses={statusOrder}
          enabledStatuses={enabledStatuses}
          onApply={(enabled) => {
            setEnabledStatuses(enabled);
            setSelectedIndex(0);
            setView("jira");
          }}
          onClose={() => setView("jira")}
          height={height}
          width={width}
        />
      </Box>
    );
  }

  if (showMemberSelect) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <MemberSelect
          selectedIds={filterAccountIds}
          onApply={(ids) => {
            setFilterAccountIds(ids);
            if (ids.size > 0) {
              setFilterMode("person");
            } else {
              setFilterMode("team");
            }
            setSelectedIndex(0);
            setView("jira");
          }}
          onClose={() => setView("jira")}
          height={height}
          width={width}
        />
      </Box>
    );
  }

  if (showHelp) {
    return <HelpOverlay height={height} width={width} view="jira" />;
  }

  if (showDetail && selectedIssue) {
    return (
      <IssueDetail
        issue={selectedIssue}
        detailIssue={detailIssue}
        detailLoading={detailLoading}
        detailError={detailError}
        height={height}
        width={width}
        onOpenInBrowser={openInBrowser}
        jiraSite={config.jiraSite}
      />
    );
  }

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
          fetching={loading}
          searchText={searchMode ? searchText : null}
          statusFilterActive={!allStatusesEnabled}
          sortLabel={JIRA_SORT_LABELS[sortMode]}
          error={error}
        />
      </Box>
    </Box>
  );
}
