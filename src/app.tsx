import React, { useState, useCallback, useRef } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { useScreenSize } from "./hooks/use-screen-size.ts";
import type { GraphQLClient } from "./api/client.ts";
import type { FilterMode, FocusArea, SortMode } from "./api/types.ts";
import { useConfig } from "./hooks/use-config.ts";
import { usePullRequests } from "./hooks/use-pull-requests.ts";
import { useRepos } from "./hooks/use-repos.ts";
import { usePRDetail } from "./hooks/use-pr-detail.ts";
import { useNotifications } from "./hooks/use-notifications.ts";
import { Sidebar } from "./components/sidebar.tsx";
import { PRList } from "./components/pr-list.tsx";
import { StatusBar } from "./components/status-bar.tsx";
import { HelpOverlay } from "./components/help-overlay.tsx";
import { RepoSearch } from "./components/repo-search.tsx";
import { PRDetailPanel } from "./components/pr-detail.tsx";
import { NotificationsView } from "./components/notifications-view.tsx";
import { copyToClipboard } from "./utils/clipboard.ts";
import { ADD_PR_REVIEW, ADD_PR_COMMENT } from "./api/mutations.ts";

interface Props {
  client: GraphQLClient;
  org?: string;
  token: string;
}

const SORT_MODES: SortMode[] = ["repo-updated", "updated", "oldest"];

export function App({ client, org, token }: Props) {
  const { exit } = useApp();
  const { height, width } = useScreenSize();
  const {
    config,
    addRepo,
    removeRepo,
    addOrg,
    setActiveOrg,
    markViewed,
    isFirstLaunch,
  } = useConfig(org);
  const { repos: orgRepos, loading: reposLoading } = useRepos(
    client,
    config.activeOrg,
  );

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [focus, setFocus] = useState<FocusArea>("list");
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showRepoSearch, setShowRepoSearch] = useState(isFirstLaunch);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("repo-updated");
  const [showDetail, setShowDetail] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingApprove, setPendingApprove] = useState<{
    prId: string;
    prNumber: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [commentMode, setCommentMode] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState<"comment" | "request-changes">(
    "comment",
  );
  const statusMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine selected repo filter from sidebar
  const sidebarItems: (string | null)[] = [null, ...config.repos];
  const selectedRepo = sidebarItems[sidebarIndex] ?? null;

  const { prs, allPRs, loading, error, lastRefresh, refetch } = usePullRequests(
    client,
    config.repos,
    filterMode,
    selectedRepo,
    sortMode,
  );

  const {
    detail: prDetail,
    loading: detailLoading,
    error: detailError,
  } = usePRDetail(client, showDetail ? (prs[listIndex]?.id ?? null) : null);

  const {
    notifications,
    loading: notifLoading,
    unreadCount,
  } = useNotifications(token);

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (statusMessageTimer.current) clearTimeout(statusMessageTimer.current);
    statusMessageTimer.current = setTimeout(() => setStatusMessage(""), 3000);
  }, []);

  const openInBrowser = useCallback(async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  }, []);

  const submitComment = useCallback(
    async (text: string, type: "comment" | "request-changes") => {
      const pr = prs[listIndex];
      if (!pr || !text.trim()) return;

      try {
        if (type === "comment") {
          await client(ADD_PR_COMMENT, {
            subjectId: pr.id,
            body: text,
          });
          showStatus(`Commented on PR #${pr.number}`);
        } else {
          await client(ADD_PR_REVIEW, {
            pullRequestId: pr.id,
            event: "REQUEST_CHANGES",
            body: text,
          });
          showStatus(`Requested changes on PR #${pr.number}`);
        }
        refetch();
      } catch (err: any) {
        showStatus(`Error: ${err.message}`);
      }
    },
    [client, prs, listIndex, refetch, showStatus],
  );

  useInput((input, key) => {
    // Overlays capture input
    if (showRepoSearch) return;
    if (showDetail) return;
    if (showNotifications) return;

    if (showHelp) {
      if (input === "?" || key.escape) setShowHelp(false);
      return;
    }

    // Comment input mode
    if (commentMode) {
      if (key.escape) {
        setCommentMode(false);
        setCommentText("");
        showStatus("Cancelled");
        return;
      }
      if (key.backspace || key.delete) {
        setCommentText((s) => s.slice(0, -1));
        return;
      }
      if (key.return) {
        submitComment(commentText, commentType);
        setCommentMode(false);
        setCommentText("");
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setCommentText((s) => s + input);
        return;
      }
      return;
    }

    // Search mode
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

    // Handle pending approve confirmation
    if (pendingApprove) {
      if (input === "A") {
        // Second press — execute approve
        const { prId, prNumber } = pendingApprove;
        setPendingApprove(null);
        (async () => {
          try {
            await client(ADD_PR_REVIEW, {
              pullRequestId: prId,
              event: "APPROVE",
            });
            showStatus(`Approved PR #${prNumber}`);
            refetch();
          } catch (err: any) {
            showStatus(`Error: ${err.message}`);
          }
        })();
        return;
      }
      // Any other key cancels
      setPendingApprove(null);
      showStatus("Cancelled");
      if (key.escape) return;
    }

    // Global shortcuts
    if (input === "q") {
      exit();
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
    if (input === "S") {
      setSortMode((prev) => {
        const idx = SORT_MODES.indexOf(prev);
        return SORT_MODES[(idx + 1) % SORT_MODES.length]!;
      });
      return;
    }
    if (input === "n") {
      setShowNotifications(true);
      return;
    }
    if (key.escape) {
      if (searchText) {
        setSearchText("");
        return;
      }
    }

    // Focus switching
    if (key.leftArrow) {
      setFocus("sidebar");
      return;
    }
    if (key.rightArrow) {
      setFocus("list");
      return;
    }

    // Navigation
    if (focus === "sidebar") {
      const maxIdx = sidebarItems.length; // +1 for "[+] Add repo"
      if (key.upArrow) setSidebarIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setSidebarIndex((i) => Math.min(maxIdx, i + 1));
      if (key.return || input === "o") {
        // If on the add repo item
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
      if (key.return || input === "p") {
        if (prs[listIndex]) {
          markViewed(prs[listIndex]!.id);
          setShowDetail(true);
        }
      }
      if (input === "o") {
        const pr = prs[listIndex];
        if (pr) {
          markViewed(pr.id);
          openInBrowser(pr.url);
        }
      }
      if (input === "r") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(pr.repository.url);
      }
      if (input === "a") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(`${pr.repository.url}/actions`);
      }
      if (input === "y") {
        const pr = prs[listIndex];
        if (pr) {
          const ok = copyToClipboard(pr.url);
          showStatus(ok ? "Copied PR URL" : "Clipboard failed");
        }
      }
      if (input === "Y") {
        const pr = prs[listIndex];
        if (pr) {
          const ok = copyToClipboard(pr.headRefName);
          showStatus(ok ? "Copied branch name" : "Clipboard failed");
        }
      }
      if (input === "A") {
        const pr = prs[listIndex];
        if (pr) {
          setPendingApprove({ prId: pr.id, prNumber: pr.number });
          showStatus(`Press A again to approve PR #${pr.number}`);
        }
      }
      if (input === "C") {
        const pr = prs[listIndex];
        if (pr) {
          setCommentType("comment");
          setCommentMode(true);
          setCommentText("");
          showStatus(`Type comment for PR #${pr.number}, Enter to submit`);
        }
      }
      if (input === "X") {
        const pr = prs[listIndex];
        if (pr) {
          setCommentType("request-changes");
          setCommentMode(true);
          setCommentText("");
          showStatus(
            `Type review comment for PR #${pr.number}, Enter to submit`,
          );
        }
      }
    }
  });

  // Layout heights
  const headerHeight = 3;
  const selectedPR = prs[listIndex] ?? null;
  const hasLabels = (selectedPR?.labels?.nodes?.length ?? 0) > 0;
  const statusBarHeight = 3 + (hasLabels ? 1 : 0);
  const mainHeight = height - headerHeight - statusBarHeight;
  const sidebarWidth = 28;
  const listWidth = width - sidebarWidth;
  const multiOrg = config.orgs.length > 1;

  if (showHelp) {
    return (
      <Box height={height} width={width}>
        <HelpOverlay height={height} width={width} />
      </Box>
    );
  }

  if (showDetail && prs[listIndex]) {
    return (
      <Box height={height} width={width}>
        <PRDetailPanel
          pr={prs[listIndex]!}
          detail={prDetail}
          loading={detailLoading}
          error={detailError}
          height={height}
          width={width}
          onClose={() => setShowDetail(false)}
          onOpenInBrowser={openInBrowser}
        />
      </Box>
    );
  }

  if (showNotifications) {
    return (
      <Box height={height} width={width}>
        <NotificationsView
          notifications={notifications}
          loading={notifLoading}
          height={height}
          width={width}
          onClose={() => setShowNotifications(false)}
          onOpenInBrowser={openInBrowser}
        />
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
          {unreadCount > 0 && (
            <Text color="yellow" bold>
              {" "}
              [{unreadCount} notifications]
            </Text>
          )}
        </Box>
        <Text dimColor>
          o Open p Detail y Copy S Sort n Notif m Mine s Review t All ? Help
        </Text>
        {error && <Text color="red">Error: {error}</Text>}
      </Box>

      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <Sidebar
          repos={config.repos}
          selectedRepo={selectedRepo}
          selectedIndex={sidebarIndex}
          isFocused={focus === "sidebar"}
          height={mainHeight}
          allPRs={allPRs}
          multiOrg={multiOrg}
        />
        <PRList
          prs={prs}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={focus === "list"}
          searchText={searchText}
          loading={loading}
          lastViewed={config.lastViewed}
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
        selectedPR={selectedPR}
        width={width}
        sortMode={sortMode}
        statusMessage={statusMessage}
        commentInput={commentMode ? commentText : ""}
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
            pinnedRepos={config.repos}
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
            orgs={config.orgs}
            activeOrg={config.activeOrg}
            onSwitchOrg={(org) => {
              setActiveOrg(org);
            }}
            onAddOrg={(org) => {
              addOrg(org);
            }}
          />
        </Box>
      )}
    </Box>
  );
}
