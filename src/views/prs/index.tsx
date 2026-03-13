import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Box, Text, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { GraphQLClient } from "../../api/client.ts";
import type {
  AppView,
  Config,
  FilterMode,
  FocusArea,
  SortMode,
  RepoNode,
} from "../../api/types.ts";
import type { GitHubNotification } from "../../hooks/use-notifications.ts";
import { usePullRequests } from "../../hooks/use-pull-requests.ts";
import { usePRDetail } from "../../hooks/use-pr-detail.ts";
import { handleGlobalKeys } from "../../hooks/use-global-keys.ts";
import { Sidebar } from "./sidebar.tsx";
import { PRList } from "./pr-list.tsx";
import { StatusBar } from "./status-bar.tsx";
import { HelpOverlay } from "../../components/help-overlay.tsx";
import { RepoSearch } from "./repo-search.tsx";
import { PRDetailPanel } from "./pr-detail/index.tsx";
import { NotificationsView } from "./notifications-view.tsx";
import { Shortcuts } from "../../components/shortcuts.tsx";
import { TabBar } from "../../components/tab-bar.tsx";
import { copyToClipboard } from "../../utils/clipboard.ts";
import { orderByTimeBucket } from "../../utils/time-buckets.ts";
import { ADD_PR_REVIEW, ADD_PR_COMMENT } from "../../api/mutations.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  client: GraphQLClient;
  token: string;
  config: Config;
  addRepo: (repo: string) => void;
  removeRepo: (repo: string) => void;
  markViewed: (prId: string) => void;
  isFirstLaunch: boolean;
  orgRepos: RepoNode[];
  reposLoading: boolean;
  notifications: GitHubNotification[];
  notifLoading: boolean;
  unreadCount: number;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  onQuit: () => void;
  height: number;
  width: number;
}

const SORT_MODES: SortMode[] = ["repo-updated", "updated", "oldest"];

export function PRView({
  client,
  token,
  config,
  addRepo,
  removeRepo,
  markViewed,
  isFirstLaunch,
  orgRepos,
  reposLoading,
  notifications,
  notifLoading,
  unreadCount,
  onSwitchView,
  onQuit,
  height,
  width,
}: Props) {
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

  const {
    prs: rawPrs,
    allPRs,
    loading,
    error,
    lastRefresh,
    secondsUntilRefresh,
    refetch,
  } = usePullRequests(
    client,
    config.repos,
    filterMode,
    selectedRepo,
    sortMode,
    config.refreshInterval,
  );

  // Reorder PRs to match time-bucket display order
  const prs = useMemo(() => orderByTimeBucket(rawPrs), [rawPrs]);

  const selectedPRForDetail = showDetail ? prs[listIndex] : null;
  const prRefForDetail = useMemo(
    () =>
      selectedPRForDetail
        ? {
            owner: selectedPRForDetail.repository.owner.login,
            repo: selectedPRForDetail.repository.name,
            number: selectedPRForDetail.number,
          }
        : null,
    [selectedPRForDetail],
  );
  const {
    detail: prDetail,
    loading: detailLoading,
    error: detailError,
  } = usePRDetail(
    client,
    selectedPRForDetail?.id ?? null,
    token,
    prRefForDetail,
  );

  // Layout measurement refs
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
      setPendingApprove(null);
      showStatus("Cancelled");
      if (key.escape) return;
    }

    // Global shortcuts
    if (
      handleGlobalKeys(input, key, {
        onQuit,
        onSwitchView,
        onHelp: () => setShowHelp(true),
      })
    )
      return;

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

  // PR dashboard rendering
  const selectedPR = prs[listIndex] ?? null;

  const mainHeight = Math.max(1, height - measuredHeader - measuredStatus);
  const multiOrg = config.orgs.length > 1;
  const displayRepoNames = config.repos.map((r) => {
    if (multiOrg) return r;
    const idx = r.indexOf("/");
    return idx >= 0 ? r.slice(idx + 1) : r;
  });
  const longestRepoLabel = Math.max(
    "All repos (999)".length,
    "[+] Add repo".length,
    ...displayRepoNames.map((r) => r.length + 6),
  );
  const sidebarWidth = Math.min(
    Math.max(longestRepoLabel + 4, 20),
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth;

  if (showHelp) {
    return (
      <Box height={height} width={width}>
        <HelpOverlay height={height} width={width} view="prs" />
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
        <Box>
          <TabBar activeView="prs" />
          {unreadCount > 0 && (
            <Text color={getTheme().activity.notification} bold>
              {"  "}[{unreadCount} notifications]
            </Text>
          )}
        </Box>
        <Shortcuts
          items={[
            { key: "o", label: "Open" },
            { key: "p", label: "Detail" },
            { key: "y", label: "Copy" },
            { key: "S", label: "Sort" },
            { key: "n", label: "Notif" },
            { key: "m", label: "My PRs" },
            { key: "s", label: "To Review" },
            { key: "t", label: "All" },
            { key: "?", label: "Help" },
          ]}
        />
        {error && <Text color={getTheme().status.failure}>Error: {error}</Text>}
      </Box>

      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <Sidebar
          repos={config.repos}
          selectedRepo={selectedRepo}
          selectedIndex={sidebarIndex}
          isFocused={focus === "sidebar"}
          height={mainHeight}
          width={sidebarWidth}
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
      <Box ref={statusRef} flexDirection="column">
        <StatusBar
          filterMode={filterMode}
          prCount={prs.length}
          totalCount={allPRs.length}
          lastRefresh={lastRefresh}
          secondsUntilRefresh={secondsUntilRefresh}
          loading={loading}
          searchText={searchMode ? searchText : ""}
          selectedPR={selectedPR}
          width={width}
          sortMode={sortMode}
          statusMessage={statusMessage}
          commentInput={commentMode ? commentText : ""}
        />
      </Box>

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
          />
        </Box>
      )}
    </Box>
  );
}
