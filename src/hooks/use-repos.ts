import { useState, useEffect, useCallback } from "react";
import type { GraphQLClient } from "../api/client.ts";
import type { RepoNode } from "../api/types.ts";
import { ORG_REPOS_QUERY } from "../api/queries.ts";

export function useRepos(client: GraphQLClient | null, orgs: string[]) {
  const [repos, setRepos] = useState<RepoNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRepos = useCallback(async () => {
    if (!client || orgs.length === 0) return;
    setLoading(true);
    setRepos([]);

    let pending = orgs.length;

    await Promise.all(
      orgs.map(async (org) => {
        try {
          const orgRepos: RepoNode[] = [];
          let cursor: string | null = null;
          let hasMore = true;

          while (hasMore) {
            const data: any = await client(ORG_REPOS_QUERY, { org, cursor });
            const repos = data.organization.repositories;
            orgRepos.push(
              ...repos.nodes
                .filter((r: any) => !r.isArchived)
                .map((r: any) => ({ ...r, owner: org })),
            );
            hasMore = repos.pageInfo.hasNextPage;
            cursor = repos.pageInfo.endCursor;
          }

          // Merge this org's repos into state immediately
          setRepos((prev) =>
            [...prev, ...orgRepos].sort((a, b) => a.name.localeCompare(b.name)),
          );
        } catch {
          // Skip failed orgs
        } finally {
          pending--;
          if (pending === 0) setLoading(false);
        }
      }),
    );
  }, [client, orgs.join(",")]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return { repos, loading, refetch: fetchRepos };
}
