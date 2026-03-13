import { useQuery } from "@tanstack/react-query";
import type { GraphQLClient } from "../api/client.ts";
import type { RepoNode } from "../api/types.ts";
import { ORG_REPOS_QUERY } from "../api/queries.ts";

async function fetchRepos(
  client: GraphQLClient,
  orgs: string[],
): Promise<RepoNode[]> {
  const allRepos: RepoNode[] = [];

  await Promise.all(
    orgs.map(async (org) => {
      try {
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
          const data: any = await client(ORG_REPOS_QUERY, { org, cursor });
          const repos = data.organization.repositories;
          allRepos.push(
            ...repos.nodes
              .filter((r: any) => !r.isArchived)
              .map((r: any) => ({ ...r, owner: org })),
          );
          hasMore = repos.pageInfo.hasNextPage;
          cursor = repos.pageInfo.endCursor;
        }
      } catch {
        // Skip failed orgs
      }
    }),
  );

  return allRepos.sort((a, b) => a.name.localeCompare(b.name));
}

export function useRepos(client: GraphQLClient | null, orgs: string[]) {
  const orgsKey = orgs.join(",");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["repos", orgsKey],
    queryFn: () => fetchRepos(client!, orgs),
    enabled: !!client && orgs.length > 0,
    staleTime: 5 * 60_000,
  });

  return { repos: data ?? [], loading: isLoading, refetch };
}
