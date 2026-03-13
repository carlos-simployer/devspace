import { useState, useEffect, useCallback, useRef } from "react";
import type { GraphQLClient } from "../api/client.ts";
import type { PullRequest, FilterMode, SortMode } from "../api/types.ts";
import { PR_QUERY, VIEWER_QUERY } from "../api/queries.ts";

function prListChanged(a: PullRequest[], b: PullRequest[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].updatedAt !== b[i].updatedAt) return true;
  }
  return false;
}

function sortPRs(prs: PullRequest[], sortMode: SortMode): PullRequest[] {
  const sorted = [...prs];
  switch (sortMode) {
    case "repo-updated":
      sorted.sort((a, b) => {
        const repoA = `${a.repository.owner.login}/${a.repository.name}`;
        const repoB = `${b.repository.owner.login}/${b.repository.name}`;
        const repoCompare = repoA.localeCompare(repoB);
        if (repoCompare !== 0) return repoCompare;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      break;
    case "updated":
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
      break;
  }
  return sorted;
}

export function usePullRequests(
  client: GraphQLClient | null,
  repos: string[],
  filterMode: FilterMode,
  selectedRepo: string | null,
  sortMode: SortMode,
  refreshIntervalSec: number,
) {
  const pollInterval = refreshIntervalSec * 1000;
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [viewer, setViewer] = useState<string>("");
  const [secondsUntilRefresh, setSecondsUntilRefresh] =
    useState(refreshIntervalSec);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstFetch = useRef(true);

  // Fetch current user login
  useEffect(() => {
    if (!client) return;
    (async () => {
      try {
        const data: any = await client(VIEWER_QUERY);
        setViewer(data.viewer.login);
      } catch {
        // ignore auth errors for viewer query
      }
    })();
  }, [client]);

  const fetchPRs = useCallback(async () => {
    if (!client || repos.length === 0) {
      setPrs([]);
      return;
    }

    // Only show loading spinner on first fetch, not background polls
    if (isFirstFetch.current) {
      setLoading(true);
    }
    setError(null);

    try {
      // Repos are already qualified (org/repo)
      const repoQueries = repos.map((r) => `repo:${r}`).join(" ");
      const stateFilter = filterMode === "closed" ? "is:closed" : "is:open";
      let searchQuery = `is:pr ${stateFilter} ${repoQueries}`;

      if (filterMode === "mine" && viewer) {
        searchQuery += ` author:${viewer}`;
      } else if (filterMode === "review" && viewer) {
        searchQuery += ` review-requested:${viewer}`;
      }

      if (filterMode === "closed") {
        searchQuery += ` sort:updated-desc`;
      }

      const allPRs: PullRequest[] = [];
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const data: any = await client(PR_QUERY, {
          searchQuery,
          cursor,
        });
        allPRs.push(...data.search.nodes.filter((n: any) => n.id));
        hasMore = data.search.pageInfo.hasNextPage;
        cursor = data.search.pageInfo.endCursor;
        // Safety: don't fetch more than 300 PRs
        if (allPRs.length >= 300) break;
      }

      // Sort using sortMode
      const sorted = sortPRs(allPRs, sortMode);

      // For closed filter, limit to last 10 per repo
      let finalPRs: PullRequest[];
      if (filterMode === "closed") {
        const counts = new Map<string, number>();
        finalPRs = sorted.filter((pr) => {
          const repo = `${pr.repository.owner.login}/${pr.repository.name}`;
          const count = counts.get(repo) ?? 0;
          if (count >= 10) return false;
          counts.set(repo, count + 1);
          return true;
        });
      } else {
        finalPRs = sorted;
      }

      // Only update state if data actually changed to avoid re-renders
      setPrs((prev) => (prListChanged(prev, finalPRs) ? finalPRs : prev));
      setLastRefresh(new Date());
      setSecondsUntilRefresh(refreshIntervalSec);
      isFirstFetch.current = false;
    } catch (err: any) {
      setError(err.message || "Failed to fetch PRs");
    } finally {
      setLoading(false);
    }
  }, [client, repos, filterMode, viewer, sortMode]);

  // Reset first fetch flag when filter changes
  useEffect(() => {
    isFirstFetch.current = true;
  }, [filterMode]);

  const startPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timerRef.current = setInterval(fetchPRs, pollInterval);
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((s) => Math.max(0, s - 1));
    }, 1000);
  }, [fetchPRs]);

  // Manual refresh: show loading, reset countdown, restart poll timer
  const manualRefetch = useCallback(() => {
    setLoading(true);
    setSecondsUntilRefresh(refreshIntervalSec);
    startPolling();
    fetchPRs();
  }, [fetchPRs, startPolling]);

  // Initial fetch and polling
  useEffect(() => {
    fetchPRs();
    startPolling();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchPRs, startPolling]);

  // Filter by selected repo (client-side)
  const filteredPRs =
    selectedRepo === null
      ? prs
      : prs.filter(
          (pr) =>
            `${pr.repository.owner.login}/${pr.repository.name}` ===
            selectedRepo,
        );

  return {
    prs: filteredPRs,
    allPRs: prs,
    loading,
    error,
    lastRefresh,
    secondsUntilRefresh,
    viewer,
    refetch: manualRefetch,
  };
}
