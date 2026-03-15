import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Box, Text, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { FilterMode, FocusArea, SortMode } from "../../api/types.ts";
import { useAppContext } from "../../app-context.ts";
import { usePullRequests } from "../../hooks/use-pull-requests.ts";
import { usePRDetail } from "../../hooks/use-pr-detail.ts";
import { useRouter, Outlet, useOutlet } from "../../ui/router.ts";
import { getBarShortcuts } from "../../ui/route-shortcuts.ts";
import { getTheme } from "../../ui/theme.ts";
import { orderByTimeBucket } from "../../utils/time-buckets.ts";
import { ADD_PR_REVIEW, ADD_PR_COMMENT } from "../../api/mutations.ts";
import { TabBar } from "../../components/tab-bar.tsx";
import { Shortcuts } from "../../components/shortcuts.tsx";
import { PrsContext, type PrsContextValue } from "./prs-context.ts";

export function PrsLayout() {
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
    height,
    width,
  } = useAppContext();
  const { route, navigate, matchedPath } = useRouter();
  const outlet = useOutlet();

  // Open search overlay on first launch
  const firstLaunchHandled = useRef(false);
  useEffect(() => {
    if (isFirstLaunch && !firstLaunchHandled.current && route === "prs") {
      firstLaunchHandled.current = true;
      navigate("prs/search");
    }
  }, [isFirstLaunch, route, navigate]);

  // ── Shared state ──────────────────────────────────────────────────────
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

  // Sidebar items
  const sidebarItems: (string | null)[] = [null, ...config.repos];
  const selectedRepo = sidebarItems[sidebarIndex] ?? null;

  // ── Data hooks ────────────────────────────────────────────────────────
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

  const prs = useMemo(() => orderByTimeBucket(rawPrs), [rawPrs]);

  // PR detail for detail sub-view
  const showDetail = route === "prs/detail";
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

  // ── Layout measurement ────────────────────────────────────────────────
  const headerRef = useRef<DOMElement>(null);
  const [measuredHeader, setMeasuredHeader] = useState(4);

  useEffect(() => {
    if (headerRef.current) {
      const h = measureElement(headerRef.current).height;
      setMeasuredHeader((prev) => (prev === h ? prev : h));
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────
  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (statusMessageTimer.current) clearTimeout(statusMessageTimer.current);
    statusMessageTimer.current = setTimeout(() => setStatusMessage(""), 3000);
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

  // ── Context value ─────────────────────────────────────────────────────
  const selectedPR = prs[listIndex] ?? null;
  const multiOrg = config.orgs.length > 1;

  const ctx: PrsContextValue = useMemo(
    () => ({
      selectedPR,
      listIndex,
      setListIndex,
      sidebarIndex,
      setSidebarIndex,
      focus,
      setFocus,
      filterMode,
      setFilterMode,
      sortMode,
      setSortMode,
      searchText,
      setSearchText,
      searchMode,
      setSearchMode,
      commentMode,
      setCommentMode,
      commentText,
      setCommentText,
      commentType,
      setCommentType,
      pendingApprove,
      setPendingApprove,
      statusMessage,
      showStatus,
      allPRs,
      prs,
      loading,
      fetching,
      error,
      refetch,
      lastRefresh,
      secondsUntilRefresh,
      prDetail,
      detailLoading,
      detailError,
      notifications,
      notifLoading,
      unreadCount,
      repos: config.repos,
      lastViewed: config.lastViewed,
      sidebarItems,
      selectedRepo,
      multiOrg,
      orgRepos,
      reposLoading,
      addRepo,
      removeRepo,
      markViewed,
      submitComment,
      client,
    }),
    [
      selectedPR,
      listIndex,
      sidebarIndex,
      focus,
      filterMode,
      sortMode,
      searchText,
      searchMode,
      commentMode,
      commentText,
      commentType,
      pendingApprove,
      statusMessage,
      showStatus,
      allPRs,
      prs,
      loading,
      fetching,
      error,
      refetch,
      lastRefresh,
      secondsUntilRefresh,
      prDetail,
      detailLoading,
      detailError,
      notifications,
      notifLoading,
      unreadCount,
      config.repos,
      config.lastViewed,
      selectedRepo,
      multiOrg,
      orgRepos,
      reposLoading,
      addRepo,
      removeRepo,
      markViewed,
      submitComment,
      client,
    ],
  );

  // ── Render ────────────────────────────────────────────────────────────
  const barShortcuts = getBarShortcuts(route, matchedPath);
  const contentHeight = height - measuredHeader;

  // For overlay children: center them, no header
  if (outlet?.isOverlay) {
    return (
      <PrsContext.Provider value={ctx}>
        <Box
          height={height}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </PrsContext.Provider>
    );
  }

  return (
    <PrsContext.Provider value={ctx}>
      <Box height={height} width={width} flexDirection="column">
        {/* PRs own header: TabBar + Shortcuts + notification count */}
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
          {error && (
            <Text color={getTheme().status.failure}>Error: {error}</Text>
          )}
        </Box>

        {/* Child view via Outlet — receives remaining height */}
        <Box flexGrow={1} height={contentHeight} flexDirection="column">
          <Outlet />
        </Box>
      </Box>
    </PrsContext.Provider>
  );
}
