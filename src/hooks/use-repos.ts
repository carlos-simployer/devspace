import { useState, useEffect, useCallback } from "react";
import type { GraphQLClient } from "../api/client.ts";
import type { RepoNode } from "../api/types.ts";
import { ORG_REPOS_QUERY } from "../api/queries.ts";

export function useRepos(client: GraphQLClient | null, org: string) {
  const [repos, setRepos] = useState<RepoNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRepos = useCallback(async () => {
    if (!client || !org) return;
    setLoading(true);
    try {
      const allRepos: RepoNode[] = [];
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const data: any = await client(ORG_REPOS_QUERY, { org, cursor });
        const repos = data.organization.repositories;
        allRepos.push(...repos.nodes.filter((r: RepoNode) => !r.isArchived));
        hasMore = repos.pageInfo.hasNextPage;
        cursor = repos.pageInfo.endCursor;
      }

      setRepos(allRepos);
    } catch {
      // Silently fail — repos list is for search overlay only
    } finally {
      setLoading(false);
    }
  }, [client, org]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return { repos, loading, refetch: fetchRepos };
}
