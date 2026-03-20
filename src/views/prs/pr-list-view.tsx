import React, { useState, useRef, useEffect } from "react";
import { Box, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { SortMode } from "../../api/types.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { copyToClipboard } from "../../utils/clipboard.ts";
import { usePrsContext } from "./prs-context.ts";
import { Sidebar } from "./sidebar.tsx";
import { PRList } from "./pr-list.tsx";
import { StatusBar } from "./status-bar.tsx";

const SORT_MODES: SortMode[] = ["repo-updated", "updated", "oldest"];

export function PrListView() {
  const { onQuit, width } = useAppContext();
  const { route, navigate } = useRouter();
  const ctx = usePrsContext();

  const {
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
    lastRefresh,
    secondsUntilRefresh,
    refetch,
    repos,
    lastViewed,
    sidebarItems,
    selectedRepo,
    multiOrg,
    addRepo,
    removeRepo,
    markViewed,
    submitComment,
  } = ctx;

  // Layout measurement
  const statusRef = useRef<DOMElement>(null);
  const [measuredStatus, setMeasuredStatus] = useState(3);

  useEffect(() => {
    if (statusRef.current) {
      const h = measureElement(statusRef.current).height;
      setMeasuredStatus((prev) => (prev === h ? prev : h));
    }
  });

  // Compute layout
  const displayRepoNames = repos.map((r) => {
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

  // ── Comment mode: raw text input ──────────────────────────────────────
  useInput(
    (input, key) => {
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
      }
    },
    { isActive: commentMode && route === "prs" },
  );

  // ── Search mode: raw text input ───────────────────────────────────────
  useInput(
    (input, key) => {
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
    { isActive: searchMode && route === "prs" },
  );

  // ── Route shortcuts ───────────────────────────────────────────────────
  const isMainView = route === "prs";

  useRouteShortcuts(
    {
      quit: onQuit,
      search: () => {
        setSearchMode(true);
        setSearchText("");
      },
      filterMine: () => setFilterMode("mine"),
      filterReview: () => setFilterMode("review"),
      filterAll: () => setFilterMode("all"),
      filterClosed: () => setFilterMode("closed"),
      toggleMerged: () =>
        setFilterMode(filterMode === "merged" ? "all" : "merged"),
      refresh: () => refetch(),
      add: () => navigate("prs/search"),
      sort: () => {
        setSortMode((prev) => {
          const idx = SORT_MODES.indexOf(prev);
          return SORT_MODES[(idx + 1) % SORT_MODES.length]!;
        });
      },
      notifications: () => navigate("prs/notifications"),
      clearSearch: () => {
        if (searchText) setSearchText("");
      },
      left: () => setFocus("sidebar"),
      right: () => setFocus("list"),

      // Navigation
      up: () => {
        if (focus === "sidebar") {
          setSidebarIndex((i) => Math.max(0, i - 1));
        } else {
          setListIndex((i) => Math.max(0, i - 1));
        }
      },
      down: () => {
        if (focus === "sidebar") {
          const maxIdx = sidebarItems.length;
          setSidebarIndex((i) => Math.min(maxIdx, i + 1));
        } else {
          setListIndex((i) => Math.min(prs.length - 1, i + 1));
        }
      },
      select: () => {
        if (focus === "sidebar") {
          if (sidebarIndex === sidebarItems.length) {
            navigate("prs/search");
          }
        } else {
          if (prs[listIndex]) {
            markViewed(prs[listIndex]!.id);
            navigate("prs/detail");
          }
        }
      },
      detail: () => {
        if (focus === "list" && prs[listIndex]) {
          markViewed(prs[listIndex]!.id);
          navigate("prs/detail");
        }
      },
      open: () => {
        if (focus === "sidebar") {
          if (sidebarIndex === sidebarItems.length) {
            navigate("prs/search");
          }
        } else {
          const pr = prs[listIndex];
          if (pr) {
            markViewed(pr.id);
            openInBrowser(pr.url);
          }
        }
      },
      openRepo: () => {
        if (focus === "list") {
          const pr = prs[listIndex];
          if (pr) openInBrowser(pr.repository.url);
        }
      },
      copyUrl: () => {
        if (focus === "list") {
          const pr = prs[listIndex];
          if (pr) {
            const ok = copyToClipboard(pr.url);
            showStatus(ok ? "Copied PR URL" : "Clipboard failed");
          }
        }
      },
      copyBranch: () => {
        if (focus === "list") {
          const pr = prs[listIndex];
          if (pr) {
            const ok = copyToClipboard(pr.headRefName);
            showStatus(ok ? "Copied branch name" : "Clipboard failed");
          }
        }
      },
      approve: () => {
        if (focus === "list") {
          const pr = prs[listIndex];
          if (pr) {
            navigate("prs/approve");
          }
        }
      },
      comment: () => {
        if (focus === "list") {
          const pr = prs[listIndex];
          if (pr) {
            setCommentType("comment");
            setCommentMode(true);
            setCommentText("");
            showStatus(`Type comment for PR #${pr.number}, Enter to submit`);
          }
        }
      },
      requestChanges: () => {
        if (focus === "list") {
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
      },
      remove: () => {
        if (focus === "sidebar") {
          if (sidebarIndex > 0 && sidebarIndex < sidebarItems.length) {
            const repo = sidebarItems[sidebarIndex];
            if (repo) {
              removeRepo(repo);
              setSidebarIndex((i) => Math.max(0, i - 1));
            }
          }
        }
      },
    },
    {
      active: !searchMode && !commentMode && isMainView,
    },
  );

  const mainHeight = ctx.contentHeight - measuredStatus;

  return (
    <Box flexGrow={1} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <Sidebar
          repos={repos}
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
          lastViewed={lastViewed}
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
