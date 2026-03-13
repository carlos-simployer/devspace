import { useQuery } from "@tanstack/react-query";
import type { GraphQLClient } from "../api/client.ts";
import { PR_DETAIL_QUERY } from "../api/queries.ts";

export interface CheckContext {
  name?: string;
  context?: string;
  status?: string;
  conclusion?: string;
  state?: string;
  detailsUrl?: string;
  targetUrl?: string;
}

export interface ReviewDetail {
  state: string;
  author: { login: string };
  submittedAt: string;
}

export interface PRFile {
  path: string;
  additions: number;
  deletions: number;
  changeType: string;
  patch: string | null;
}

export interface PRDetail {
  body: string;
  commentsCount: number;
  checks: CheckContext[];
  reviews: ReviewDetail[];
  rollupState: string | null;
  files: PRFile[];
}

interface PRRef {
  owner: string;
  repo: string;
  number: number;
}

async function fetchFilePatches(
  token: string,
  prRef: PRRef,
): Promise<Map<string, string>> {
  const patches = new Map<string, string>();
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${prRef.owner}/${prRef.repo}/pulls/${prRef.number}/files?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    if (!res.ok) break;
    const files: any[] = await res.json();
    if (files.length === 0) break;
    for (const f of files) {
      if (f.patch) {
        patches.set(f.filename, f.patch);
      }
    }
    if (files.length < 100) break;
    page++;
  }
  return patches;
}

async function fetchPRDetail(
  client: GraphQLClient,
  nodeId: string,
  token?: string,
  prRef?: PRRef | null,
): Promise<PRDetail> {
  const [data, patches] = await Promise.all([
    client(PR_DETAIL_QUERY, { nodeId }) as Promise<any>,
    token && prRef
      ? fetchFilePatches(token, prRef)
      : Promise.resolve(new Map<string, string>()),
  ]);

  const pr = data.node;
  const rollup = pr.commits?.nodes?.[0]?.commit?.statusCheckRollup ?? null;
  const checks: CheckContext[] = rollup?.contexts?.nodes ?? [];
  const reviews: ReviewDetail[] = pr.reviews?.nodes ?? [];

  const files: PRFile[] = (pr.files?.nodes ?? []).map((f: any) => ({
    path: f.path,
    additions: f.additions ?? 0,
    deletions: f.deletions ?? 0,
    changeType: f.changeType ?? "MODIFIED",
    patch: patches.get(f.path) ?? null,
  }));

  return {
    body: pr.body ?? "",
    commentsCount: pr.comments?.totalCount ?? 0,
    checks,
    reviews,
    rollupState: rollup?.state ?? null,
    files,
  };
}

export function usePRDetail(
  client: GraphQLClient | null,
  nodeId: string | null,
  token?: string,
  prRef?: PRRef | null,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pr-detail", nodeId],
    queryFn: () => fetchPRDetail(client!, nodeId!, token, prRef),
    enabled: !!client && !!nodeId,
    staleTime: 60_000,
  });

  return {
    detail: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
