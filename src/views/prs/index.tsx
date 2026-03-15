import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Box, Text, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { FilterMode, FocusArea, SortMode } from "../../api/types.ts";
import { useAppContext } from "../../app-context.ts";
import { usePullRequests } from "../../hooks/use-pull-requests.ts";
import { usePRDetail } from "../../hooks/use-pr-detail.ts";
import { useRouter } from "../../ui/router.ts";
import { matchShortcut, getBarShortcuts } from "../../ui/route-shortcuts.ts";
import { TABS, getTabNumberKeys, getBaseRoute } from "../../ui/tabs.ts";
import { Sidebar } from "./sidebar.tsx";
import { PRList } from "./pr-list.tsx";
import { StatusBar } from "./status-bar.tsx";
import { HelpOverlay } from "../../components/help-overlay.tsx";
import { RepoSearch } from "./repo-search.tsx";
import { PRDetailPanel } from "./pr-detail/index.tsx";
import { NotificationsView } from "./notifications-view.tsx";
import { ViewHeader } from "../../components/view-header.tsx";
import { Shortcuts } from "../../components/shortcuts.tsx";
import { TabBar } from "../../components/tab-bar.tsx";
import { copyToClipboard } from "../../utils/clipboard.ts";
import { orderByTimeBucket } from "../../utils/time-buckets.ts";
import { ADD_PR_REVIEW, ADD_PR_COMMENT } from "../../api/mutations.ts";
import { getTheme } from "../../ui/theme.ts";

const SORT_MODES: SortMode[] = ["repo-updated", "updated", "oldest"];

export function PRView() {
  const {
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
    onQuit,
    height,
    width,
  } = useAppContext();
  const { route, navigate } = useRouter();

  // Derive sub-view state from router route
  const showHelp = route === "prs/help";
  const showDetail = route === "prs/detail";
  const showNotifications = route === "prs/notifications";
  const showRepoSearch = route === "prs/search";

  // Open search overlay on first launch
  const firstLaunchHandled = useRef(false);
  useEffect(() => {
    if (isFirstLaunch && !firstLaunchHandled.current && route === "prs") {
      firstLaunchHandled.current = true;
      navigate("prs/search");
    }
  }, [isFirstLaunch, route, navigate]);

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [focus, setFocus] = useState<FocusArea>("list");
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("repo-updated");
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
    fetching,
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
    // Overlays capture input — sub-views have their own useInput
    if (showRepoSearch) return;
    if (showDetail) return;
    if (showNotifications) return;

    if (showHelp) {
      if (input === "?" || key.escape) navigate("prs");
      return;
    }

    // Comment input mode — raw text entry, bypass shortcut matching
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

    // Match against shortcut registry (route-specific + global)
    const action = matchShortcut(input, key, route);

    // Global shortcuts
    if (action === "quit") {
      onQuit();
      return;
    }
    if (action === "help") {
      navigate("prs/help");
      return;
    }
    if (action === "nextView") {
      const tabRoutes = TABS.map((t) => t.route);
      const currentIdx = tabRoutes.indexOf(getBaseRoute(route));
      const next = tabRoutes[(currentIdx + 1) % tabRoutes.length]!;
      navigate(next);
      return;
    }
    if (action === "prevView") {
      const tabRoutes = TABS.map((t) => t.route);
      const currentIdx = tabRoutes.indexOf(getBaseRoute(route));
      const next =
        tabRoutes[(currentIdx - 1 + tabRoutes.length) % tabRoutes.length]!;
      navigate(next);
      return;
    }

    // Tab number keys (1-7)
    const tabKeys = getTabNumberKeys();
    if (tabKeys[input]) {
      navigate(tabKeys[input]!);
      return;
    }

    // PR view-specific shortcuts
    if (action === "search") {
      setSearchMode(true);
      setSearchText("");
      return;
    }
    if (action === "filterMine") {
      setFilterMode("mine");
      return;
    }
    if (action === "filterReview") {
      setFilterMode("review");
      return;
    }
    if (action === "filterAll") {
      setFilterMode("all");
      return;
    }
    if (action === "filterClosed") {
      setFilterMode("closed");
      return;
    }
    if (action === "refresh") {
      refetch();
      return;
    }
    if (action === "add") {
      navigate("prs/search");
      return;
    }
    if (action === "sort") {
      setSortMode((prev) => {
        const idx = SORT_MODES.indexOf(prev);
        return SORT_MODES[(idx + 1) % SORT_MODES.length]!;
      });
      return;
    }
    if (action === "notifications") {
      navigate("prs/notifications");
      return;
    }
    if (action === "clearSearch") {
      if (searchText) {
        setSearchText("");
        return;
      }
    }

    // Focus switching
    if (action === "left") {
      setFocus("sidebar");
      return;
    }
    if (action === "right") {
      setFocus("list");
      return;
    }

    // Navigation
    if (focus === "sidebar") {
      const maxIdx = sidebarItems.length;
      if (action === "up") setSidebarIndex((i) => Math.max(0, i - 1));
      if (action === "down") setSidebarIndex((i) => Math.min(maxIdx, i + 1));
      if (action === "select" || action === "open") {
        if (sidebarIndex === sidebarItems.length) {
          navigate("prs/search");
          return;
        }
      }
      if (action === "remove") {
        if (sidebarIndex > 0 && sidebarIndex < sidebarItems.length) {
          const repo = sidebarItems[sidebarIndex];
          if (repo) {
            removeRepo(repo);
            setSidebarIndex((i) => Math.max(0, i - 1));
          }
        }
      }
    }

    if (focus === "list") {
      if (action === "up") setListIndex((i) => Math.max(0, i - 1));
      if (action === "down")
        setListIndex((i) => Math.min(prs.length - 1, i + 1));
      if (action === "select" || action === "detail") {
        if (prs[listIndex]) {
          markViewed(prs[listIndex]!.id);
          navigate("prs/detail");
        }
      }
      if (action === "open") {
        const pr = prs[listIndex];
        if (pr) {
          markViewed(pr.id);
          openInBrowser(pr.url);
        }
      }
      if (action === "openRepo") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(pr.repository.url);
      }
      if (action === "openActions") {
        const pr = prs[listIndex];
        if (pr) openInBrowser(`${pr.repository.url}/actions`);
      }
      if (action === "copyUrl") {
        const pr = prs[listIndex];
        if (pr) {
          const ok = copyToClipboard(pr.url);
          showStatus(ok ? "Copied PR URL" : "Clipboard failed");
        }
      }
      if (action === "copyBranch") {
        const pr = prs[listIndex];
        if (pr) {
          const ok = copyToClipboard(pr.headRefName);
          showStatus(ok ? "Copied branch name" : "Clipboard failed");
        }
      }
      if (action === "approve") {
        const pr = prs[listIndex];
        if (pr) {
          setPendingApprove({ prId: pr.id, prNumber: pr.number });
          showStatus(`Press A again to approve PR #${pr.number}`);
        }
      }
      if (action === "comment") {
        const pr = prs[listIndex];
        if (pr) {
          setCommentType("comment");
          setCommentMode(true);
          setCommentText("");
          showStatus(`Type comment for PR #${pr.number}, Enter to submit`);
        }
      }
      if (action === "requestChanges") {
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

  const barShortcuts = getBarShortcuts(route);

  // Height of the shared header (TabBar + Shortcuts + border)
  const sharedHeaderHeight = 3;

  if (showHelp) {
    return (
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader route={route} />
        <HelpOverlay
          height={height - sharedHeaderHeight}
          width={width}
          route="prs"
        />
      </Box>
    );
  }

  if (showDetail && prs[listIndex]) {
    return (
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader route={route} />
        <PRDetailPanel
          pr={prs[listIndex]!}
          detail={prDetail}
          loading={detailLoading}
          error={detailError}
          height={height - sharedHeaderHeight}
          width={width}
          onClose={() => navigate("prs")}
          onOpenInBrowser={openInBrowser}
        />
      </Box>
    );
  }

  if (showNotifications) {
    return (
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader route={route} />
        <NotificationsView
          notifications={notifications}
          loading={notifLoading}
          height={height - sharedHeaderHeight}
          width={width}
          onClose={() => navigate("prs")}
          onOpenInBrowser={openInBrowser}
        />
      </Box>
    );
  }

  if (showRepoSearch) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
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
          onClose={() => navigate("prs")}
          height={height}
          width={width}
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
        <Shortcuts items={barShortcuts} />
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
          fetching={fetching}
          searchText={searchMode ? searchText : null}
          selectedPR={selectedPR}
          width={width}
          sortMode={sortMode}
          statusMessage={statusMessage}
          commentInput={commentMode ? commentText : ""}
        />
      </Box>
    </Box>
  );
}
