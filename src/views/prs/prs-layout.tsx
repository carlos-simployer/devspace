import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Box } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { usePullRequests } from "../../hooks/use-pull-requests.ts";
import { usePRDetail } from "../../hooks/use-pr-detail.ts";
import { useRouter, Outlet, useOutlet } from "../../ui/router.ts";
import { PrListView } from "./pr-list-view.tsx";
import { FocusProvider, useFocus } from "../../ui/focus.ts";
import { orderByTimeBucket } from "../../utils/time-buckets.ts";
import { ADD_PR_REVIEW, ADD_PR_COMMENT } from "../../api/mutations.ts";
import { PrsContext, type PrsContextValue } from "./prs-context.ts";
import { prsStore } from "./prs-store.ts";

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
    contentHeight,
    height,
    width,
  } = useAppContext();
  const { route, navigate } = useRouter();
  const outlet = useOutlet();

  // Open search overlay on first launch
  const firstLaunchHandled = useRef(false);
  useEffect(() => {
    if (isFirstLaunch && !firstLaunchHandled.current && route === "prs") {
      firstLaunchHandled.current = true;
      navigate("prs/search");
    }
  }, [isFirstLaunch, route, navigate]);

  // ── Persisted state (survives tab switches) ─────────────────────────
  const {
    filterMode,
    setFilterMode,
    focus,
    setFocus,
    sidebarIndex,
    setSidebarIndex,
    listIndex,
    setListIndex,
    sortMode,
    setSortMode,
  } = useStore(prsStore);
  // ── Transient state (resets on tab switch) ──────────────────────────
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
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
      contentHeight,
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
      contentHeight,
      height,
    ],
  );

  // ── Render ────────────────────────────────────────────────────────────
  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus={focus}>
      <PrsContext.Provider value={ctx}>
        <FocusSync setFocus={setFocus} />
        <Box height={contentHeight} width={width}>
          {/* Main content layer — always show index view */}
          <Box height={contentHeight} width={width} flexDirection="column">
            {isOverlay ? <PrListView /> : <Outlet />}
          </Box>

          {/* Overlay layer — dialog on top */}
          {isOverlay && (
            <Box
              position="absolute"
              width={width}
              height={contentHeight}
              alignItems="center"
              justifyContent="center"
            >
              <Outlet />
            </Box>
          )}
        </Box>
      </PrsContext.Provider>
    </FocusProvider>
  );
}

/**
 * FocusSync — syncs FocusProvider's focusedId back to the Zustand store.
 * Must be rendered inside both FocusProvider and PrsContext.Provider.
 */
function FocusSync({
  setFocus,
}: {
  setFocus: (v: "sidebar" | "list") => void;
}) {
  const { focusedId } = useFocus();
  const prevRef = useRef(focusedId);

  useEffect(() => {
    if (focusedId !== prevRef.current) {
      prevRef.current = focusedId;
      if (focusedId === "sidebar" || focusedId === "list") {
        setFocus(focusedId);
      }
    }
  }, [focusedId, setFocus]);

  return null;
}
