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

export interface PRDetail {
  body: string;
  commentsCount: number;
  checks: CheckContext[];
  reviews: ReviewDetail[];
  rollupState: string | null;
}

export function usePRDetail(
  client: GraphQLClient | null,
  nodeId: string | null,
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
        const data: any = await client(PR_DETAIL_QUERY, { nodeId });
        if (cancelled) return;

        const pr = data.node;
        const rollup =
          pr.commits?.nodes?.[0]?.commit?.statusCheckRollup ?? null;
        const checks: CheckContext[] = rollup?.contexts?.nodes ?? [];
        const reviews: ReviewDetail[] = pr.reviews?.nodes ?? [];

        setDetail({
          body: pr.body ?? "",
          commentsCount: pr.comments?.totalCount ?? 0,
          checks,
          reviews,
          rollupState: rollup?.state ?? null,
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
  }, [client, nodeId]);

  return { detail, loading, error };
}
