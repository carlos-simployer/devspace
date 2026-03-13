import { useState, useEffect } from "react";
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

export function usePRDetail(
  client: GraphQLClient | null,
  nodeId: string | null,
  token?: string,
  prRef?: PRRef | null,
) {
  const [detail, setDetail] = useState<PRDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !nodeId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [data, patches] = await Promise.all([
          client(PR_DETAIL_QUERY, { nodeId }) as Promise<any>,
          token && prRef
            ? fetchFilePatches(token, prRef)
            : Promise.resolve(new Map<string, string>()),
        ]);
        if (cancelled) return;

        const pr = data.node;
        const rollup =
          pr.commits?.nodes?.[0]?.commit?.statusCheckRollup ?? null;
        const checks: CheckContext[] = rollup?.contexts?.nodes ?? [];
        const reviews: ReviewDetail[] = pr.reviews?.nodes ?? [];

        const files: PRFile[] = (pr.files?.nodes ?? []).map((f: any) => ({
          path: f.path,
          additions: f.additions ?? 0,
          deletions: f.deletions ?? 0,
          changeType: f.changeType ?? "MODIFIED",
          patch: patches.get(f.path) ?? null,
        }));

        setDetail({
          body: pr.body ?? "",
          commentsCount: pr.comments?.totalCount ?? 0,
          checks,
          reviews,
          rollupState: rollup?.state ?? null,
          files,
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch PR details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, nodeId, token, prRef?.owner, prRef?.repo, prRef?.number]);

  return { detail, loading, error };
}
