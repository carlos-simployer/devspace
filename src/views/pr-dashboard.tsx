import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type { GraphQLClient } from "../api/client.ts";
import type { FilterMode, FocusArea, RepoNode } from "../api/types.ts";
import { usePullRequests } from "../hooks/use-pull-requests.ts";
import { Sidebar } from "../components/sidebar.tsx";
import { PRList } from "../components/pr-list.tsx";
import { StatusBar } from "../components/status-bar.tsx";
import { HelpOverlay } from "../components/help-overlay.tsx";
import { RepoSearch } from "../components/repo-search.tsx";

interface Props {
  client: GraphQLClient;
  org: string;
  repos: string[];
  orgRepos: RepoNode[];
  reposLoading: boolean;
  addRepo: (repo: string) => void;
  removeRepo: (repo: string) => void;
  isFirstLaunch: boolean;
  onSwitchView: () => void;
  height: number;
  width: number;
  onQuit: () => void;
}

export function PRDashboard({
  client,
  org,
  repos,
  orgRepos,
  reposLoading,
  addRepo,
  removeRepo,
  isFirstLaunch,
  onSwitchView,
  height,
  width,
  onQuit,
}: Props) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [focus, setFocus] = useState<FocusArea>("list");
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showRepoSearch, setShowRepoSearch] = useState(isFirstLaunch);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");

  const sidebarItems = [null, ...repos];
  const selectedRepo = sidebarItems[sidebarIndex] ?? null;

  const { prs, allPRs, loading, error, lastRefresh, refetch } = usePullRequests(
    client,
    org,
    repos,
    filterMode,
    selectedRepo,
  );

  const openInBrowser = useCallback(async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  }, []);

  useInput((input, key) => {
    if (showRepoSearch) return;

    if (showHelp) {
      if (input === "?" || key.escape) setShowHelp(false);
      return;
    }

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
      return;
    }

    if (input === "q") {
      onQuit();
      return;
    }

    if (key.tab) {
      onSwitchView();
      return;
    }

    if (input === "?") {
      setShowHelp(true);
      return;
    }
    if (input === "/") {
      setSearchMode(true);
      setSearchText("");
      return;
    }
    if (input === "m") {
      setFilterMode("mine");
      return;
    }
    if (input === "s") {
      setFilterMode("review");
      return;
    }
    if (input === "t") {
      setFilterMode("all");
      return;
    }
    if (input === "c") {
      setFilterMode("closed");
      return;
    }
    if (input === "R") {
      refetch();
      return;
    }
    if (input === "+") {
      setShowRepoSearch(true);
      return;
    }
    if (key.escape) {
      if (searchText) {
        setSearchText("");
        return;
      }
    }

    if (key.leftArrow) {
      setFocus("sidebar");
      return;
    }
    if (key.rightArrow) {
      setFocus("list");
      return;
    }

    if (focus === "sidebar") {
      const maxIdx = sidebarItems.length;
      if (key.upArrow) setSidebarIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setSidebarIndex((i) => Math.min(maxIdx, i + 1));
      if (key.return || input === "o") {
        if (sidebarIndex === sidebarItems.length) {
          setShowRepoSearch(true);
          return;
        }
      }
      if (
        (input === "d" || input === "-") &&
        sidebarIndex > 0 &&
        sidebarIndex < sidebarItems.length
      ) {
        const repo = sidebarItems[sidebarIndex];
        if (repo) {
          removeRepo(repo);
          setSidebarIndex((i) => Math.max(0, i - 1));
        }
      }
    }

    if (focus === "list") {
      if (key.upArrow) setListIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setListIndex((i) => Math.min(prs.length - 1, i + 1));
      if (key.return || input === "o") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(pr.url);
      }
      if (input === "r") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(pr.repository.url);
      }
      if (input === "a") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(`${pr.repository.url}/actions`);
      }
    }
  });

  const headerHeight = 3;
  const statusBarHeight = 3;
  const mainHeight = height - headerHeight - statusBarHeight;
  const sidebarWidth = 28;
  const listWidth = width - sidebarWidth;

  if (showHelp) {
    return (
      <Box height={height} width={width}>
        <HelpOverlay height={height} width={width} view="prs" />
      </Box>
    );
  }

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Header */}
      <Box
        width={width}
        height={headerHeight}
        flexDirection="column"
        paddingX={1}
      >
        <Box>
          <Text bold color="cyan">
            GitHub PR Dashboard
          </Text>
          <Text dimColor> [Tab: switch to Dependencies]</Text>
        </Box>
        <Text dimColor>
          o Open r Repo a Actions m Mine s Review t All c Closed ? Help
        </Text>
        {error && <Text color="red">Error: {error}</Text>}
      </Box>

      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <Sidebar
          repos={repos}
          selectedRepo={selectedRepo}
          selectedIndex={sidebarIndex}
          isFocused={focus === "sidebar"}
          height={mainHeight}
        />
        <PRList
          prs={prs}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={focus === "list"}
          searchText={searchText}
          loading={loading}
        />
      </Box>

      {/* Status bar */}
      <StatusBar
        filterMode={filterMode}
        prCount={prs.length}
        totalCount={allPRs.length}
        lastRefresh={lastRefresh}
        loading={loading}
        searchText={searchMode ? searchText : ""}
        selectedPR={prs[listIndex] ?? null}
        width={width}
      />

      {/* Repo search overlay */}
      {showRepoSearch && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 20) / 2)}
        >
          <RepoSearch
            repos={orgRepos}
            pinnedRepos={repos}
            loading={reposLoading}
            onSelect={(repo) => {
              addRepo(repo);
            }}
            onRemove={(repo) => {
              removeRepo(repo);
            }}
            onClose={() => setShowRepoSearch(false)}
            height={height}
            width={width}
          />
        </Box>
      )}
    </Box>
  );
}
