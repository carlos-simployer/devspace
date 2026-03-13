import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GraphQLClient } from "../api/client.ts";
import type { PullRequest, FilterMode, SortMode } from "../api/types.ts";
import { PR_QUERY, VIEWER_QUERY } from "../api/queries.ts";
import { sortPRs } from "../utils/pr-sort.ts";

async function fetchViewer(client: GraphQLClient): Promise<string> {
  const data: any = await client(VIEWER_QUERY);
  return data.viewer.login;
}

async function fetchPullRequests(
  client: GraphQLClient,
  repos: string[],
  filterMode: FilterMode,
  sortMode: SortMode,
  viewer: string,
): Promise<PullRequest[]> {
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
    const data: any = await client(PR_QUERY, { searchQuery, cursor });
    allPRs.push(...data.search.nodes.filter((n: any) => n.id));
    hasMore = data.search.pageInfo.hasNextPage;
    cursor = data.search.pageInfo.endCursor;
    if (allPRs.length >= 300) break;
  }

  const sorted = sortPRs(allPRs, sortMode);

  if (filterMode === "closed") {
    const counts = new Map<string, number>();
    return sorted.filter((pr) => {
      const repo = `${pr.repository.owner.login}/${pr.repository.name}`;
      const count = counts.get(repo) ?? 0;
      if (count >= 10) return false;
      counts.set(repo, count + 1);
      return true;
    });
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
  const reposKey = repos.join(",");

  const { data: viewer = "" } = useQuery({
    queryKey: ["viewer"],
    queryFn: () => fetchViewer(client!),
    enabled: !!client,
    staleTime: Infinity,
  });

  const {
    data: allPRs,
    isLoading,
    isFetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["pull-requests", reposKey, filterMode, sortMode],
    queryFn: () =>
      fetchPullRequests(client!, repos, filterMode, sortMode, viewer),
    enabled: !!client && repos.length > 0 && !!viewer,
    refetchInterval: refreshIntervalSec * 1000,
  });

  // Countdown timer derived from dataUpdatedAt
  const [secondsUntilRefresh, setSecondsUntilRefresh] =
    useState(refreshIntervalSec);

  useEffect(() => {
    const id = setInterval(() => {
      if (!dataUpdatedAt) return;
      const elapsed = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      setSecondsUntilRefresh(Math.max(0, refreshIntervalSec - elapsed));
    }, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt, refreshIntervalSec]);

  // Reset countdown when interval config changes
  useEffect(() => {
    setSecondsUntilRefresh(refreshIntervalSec);
  }, [refreshIntervalSec]);

  // Client-side repo filter
  const filteredPRs = useMemo(() => {
    const prs = allPRs ?? [];
    if (selectedRepo === null) return prs;
    return prs.filter(
      (pr) =>
        `${pr.repository.owner.login}/${pr.repository.name}` === selectedRepo,
    );
  }, [allPRs, selectedRepo]);

  // Manual refetch resets countdown
  const manualRefetch = useCallback(() => {
    setSecondsUntilRefresh(refreshIntervalSec);
    refetch();
  }, [refetch, refreshIntervalSec]);

  return {
    prs: filteredPRs,
    allPRs: allPRs ?? [],
    loading: isLoading,
    fetching: isFetching,
    error: error?.message ?? null,
    lastRefresh: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    secondsUntilRefresh,
    viewer,
    refetch: manualRefetch,
  };
}
