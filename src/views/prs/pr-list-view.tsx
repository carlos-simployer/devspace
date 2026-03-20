import React, { useState, useRef, useEffect } from "react";
import { Box, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import type { SortMode } from "../../api/types.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useFocusNode } from "../../ui/focus.ts";
import { Panel } from "../../ui/panel.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useTextInput } from "../../hooks/use-text-input.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { copyToClipboard } from "../../utils/clipboard.ts";
import { usePrsContext } from "./prs-context.ts";
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
    removeRepo,
    markViewed,
    submitComment,
  } = ctx;

  // ── Focus nodes ─────────────────────────────────────────────────────
  const { isFocused: sidebarFocused } = useFocusNode({
    id: "sidebar",
    order: 0,
  });
  const { isFocused: listFocused } = useFocusNode({
    id: "list",
    order: 1,
  });

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
  const gap = 1;
  const sidebarWidth = Math.min(
    Math.max(longestRepoLabel + 4, 20),
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth - gap;

  // ── Text input hooks ────────────────────────────────────────────────
  const commentInput = useTextInput();
  const searchInput = useTextInput();

  // ── Comment mode: raw text input ──────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) {
        setCommentMode(false);
        setCommentText("");
        commentInput.clear();
        showStatus("Cancelled");
        return;
      }
      if (key.return) {
        submitComment(commentInput.query, commentType);
        setCommentMode(false);
        setCommentText("");
        commentInput.clear();
        return;
      }
      if (commentInput.handleInput(input, key)) {
        setCommentText(commentInput.query + (input || ""));
      }
    },
    { isActive: commentMode && route === "prs" },
  );

  // Sync commentInput.query -> commentText
  useEffect(() => {
    if (commentMode) {
      setCommentText(commentInput.query);
    }
  }, [commentInput.query, commentMode, setCommentText]);

  // ── Search mode: raw text input ───────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) {
        setSearchMode(false);
        setSearchText("");
        searchInput.clear();
        return;
      }
      if (key.return) {
        setSearchMode(false);
        return;
      }
      if (searchInput.handleInput(input, key)) {
        setSearchText(searchInput.query + (input || ""));
      }
    },
    { isActive: searchMode && route === "prs" },
  );

  // Sync searchInput.query -> searchText
  useEffect(() => {
    if (searchMode) {
      setSearchText(searchInput.query);
    }
  }, [searchInput.query, searchMode, setSearchText]);

  // ── Route shortcuts with focusHandlers ──────────────────────────────
  const isMainView = route === "prs";

  useRouteShortcuts(
    {
      quit: onQuit,
      search: () => {
        setSearchMode(true);
        setSearchText("");
        searchInput.clear();
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
    },
    {
      active: !searchMode && !commentMode && isMainView,
      focusHandlers: {
        sidebar: {
          up: () => setSidebarIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = sidebarItems.length;
            setSidebarIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            if (sidebarIndex === sidebarItems.length) {
              navigate("prs/search");
            }
          },
          open: () => {
            if (sidebarIndex === sidebarItems.length) {
              navigate("prs/search");
            }
          },
          remove: () => {
            if (sidebarIndex > 0 && sidebarIndex < sidebarItems.length) {
              const repo = sidebarItems[sidebarIndex];
              if (repo) {
                removeRepo(repo);
                setSidebarIndex((i) => Math.max(0, i - 1));
              }
            }
          },
        },
        list: {
          up: () => setListIndex((i) => Math.max(0, i - 1)),
          down: () => setListIndex((i) => Math.min(prs.length - 1, i + 1)),
          select: () => {
            if (prs[listIndex]) {
              markViewed(prs[listIndex]!.id);
              navigate("prs/detail");
            }
          },
          detail: () => {
            if (prs[listIndex]) {
              markViewed(prs[listIndex]!.id);
              navigate("prs/detail");
            }
          },
          open: () => {
            const pr = prs[listIndex];
            if (pr) {
              markViewed(pr.id);
              openInBrowser(pr.url);
            }
          },
          openRepo: () => {
            const pr = prs[listIndex];
            if (pr) openInBrowser(pr.repository.url);
          },
          openActions: () => {
            const pr = prs[listIndex];
            if (pr) openInBrowser(`${pr.repository.url}/actions`);
          },
          copyUrl: () => {
            const pr = prs[listIndex];
            if (pr) {
              const ok = copyToClipboard(pr.url);
              showStatus(ok ? "Copied PR URL" : "Clipboard failed");
            }
          },
          copyBranch: () => {
            const pr = prs[listIndex];
            if (pr) {
              const ok = copyToClipboard(pr.headRefName);
              showStatus(ok ? "Copied branch name" : "Clipboard failed");
            }
          },
          approve: () => {
            const pr = prs[listIndex];
            if (pr) {
              navigate("prs/approve");
            }
          },
          comment: () => {
            const pr = prs[listIndex];
            if (pr) {
              setCommentType("comment");
              setCommentMode(true);
              setCommentText("");
              commentInput.clear();
              showStatus(`Type comment for PR #${pr.number}, Enter to submit`);
            }
          },
          requestChanges: () => {
            const pr = prs[listIndex];
            if (pr) {
              setCommentType("request-changes");
              setCommentMode(true);
              setCommentText("");
              commentInput.clear();
              showStatus(
                `Type review comment for PR #${pr.number}, Enter to submit`,
              );
            }
          },
        },
      },
    },
  );

  const mainHeight = ctx.contentHeight - measuredStatus;

  // Build sidebar items for the generic Sidebar component
  const prCounts = new Map<string, number>();
  for (const pr of allPRs) {
    const key = `${pr.repository.owner.login}/${pr.repository.name}`;
    prCounts.set(key, (prCounts.get(key) ?? 0) + 1);
  }
  const totalCount = allPRs.length;

  function displayName(qualifiedRepo: string): string {
    if (multiOrg) return qualifiedRepo;
    const idx = qualifiedRepo.indexOf("/");
    return idx >= 0 ? qualifiedRepo.slice(idx + 1) : qualifiedRepo;
  }

  const sidebarItemsUI = [
    {
      key: "all",
      label: `All repos (${totalCount})`,
      isCurrent: selectedRepo === null,
      prefix: selectedRepo === null ? "● " : "  ",
    },
    ...repos.map((r) => ({
      key: r,
      label: `${displayName(r)} (${prCounts.get(r) ?? 0})`,
      isCurrent: r === selectedRepo,
      prefix: r === selectedRepo ? "● " : "  ",
    })),
    {
      key: "add",
      label: "[+] Add repo",
      isAdd: true,
    },
  ];

  return (
    <Box flexGrow={1} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight} gap={gap}>
        <Panel
          title="Repos"
          focused={sidebarFocused}
          width={sidebarWidth}
          height={mainHeight}
          paddingX={0}
        >
          <SidebarContent
            items={sidebarItemsUI}
            selectedIndex={sidebarIndex}
            focused={sidebarFocused}
            innerWidth={sidebarWidth - 2}
          />
        </Panel>
        <PRList
          prs={prs}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={listFocused}
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

// ── Inline sidebar content (renders inside Panel) ───────────────────

import { Text } from "ink";
import { getTheme } from "../../ui/theme.ts";

interface SidebarItemUI {
  key: string;
  label: string;
  isAdd?: boolean;
  isCurrent?: boolean;
  prefix?: string;
}

function SidebarContent({
  items,
  selectedIndex,
  focused,
  innerWidth,
}: {
  items: SidebarItemUI[];
  selectedIndex: number;
  focused: boolean;
  innerWidth: number;
}) {
  return (
    <>
      {items.map((item, i) => {
        const isActive = focused && i === selectedIndex;
        const prefix = item.prefix ?? "";
        const text = prefix + item.label;
        const padded = isActive ? text.padEnd(innerWidth) : text;

        return (
          <Box key={item.key}>
            <Text
              inverse={isActive}
              color={
                isActive
                  ? undefined
                  : item.isAdd
                    ? getTheme().list.addAction
                    : item.isCurrent
                      ? "white"
                      : undefined
              }
              bold={isActive || !!item.isCurrent}
              dimColor={!focused && !item.isCurrent && !isActive}
            >
              {padded}
            </Text>
          </Box>
        );
      })}
    </>
  );
}
