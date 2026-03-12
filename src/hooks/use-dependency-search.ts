import { useState, useCallback, useEffect, useRef } from "react";
import type { TrackedPackage } from "../api/types.ts";
import { searchPackageUsage } from "../api/dependency-queries.ts";

const POLL_INTERVAL = 120_000; // 2 minutes

export function useDependencySearch(
  token: string,
  org: string,
  trackedPackages: string[],
) {
  const [packages, setPackages] = useState<Map<string, TrackedPackage>>(
    new Map(),
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPackage = useCallback(
    async (packageName: string) => {
      if (!org) return;

      setPackages((prev) => {
        const next = new Map(prev);
        const existing = next.get(packageName);
        next.set(packageName, {
          name: packageName,
          results: existing?.results ?? [],
          loading: true,
          error: null,
          lastRefresh: existing?.lastRefresh ?? null,
        });
        return next;
      });

      try {
        const results = await searchPackageUsage(token, org, packageName);
        setPackages((prev) => {
          const next = new Map(prev);
          next.set(packageName, {
            name: packageName,
            results,
            loading: false,
            error: null,
            lastRefresh: new Date(),
          });
          return next;
        });
      } catch (err: any) {
        setPackages((prev) => {
          const next = new Map(prev);
          const existing = next.get(packageName);
          next.set(packageName, {
            name: packageName,
            results: existing?.results ?? [],
            loading: false,
            error: err.message || "Search failed",
            lastRefresh: existing?.lastRefresh ?? null,
          });
          return next;
        });
      }
    },
    [token, org],
  );

  const fetchAll = useCallback(async () => {
    // Fetch sequentially to avoid rate limits
    for (const pkg of trackedPackages) {
      await fetchPackage(pkg);
    }
  }, [trackedPackages, fetchPackage]);

  // Sync tracked packages with state
  useEffect(() => {
    setPackages((prev) => {
      const next = new Map(prev);
      // Remove untracked
      for (const key of next.keys()) {
        if (!trackedPackages.includes(key)) next.delete(key);
      }
      // Add new (will be fetched below)
      for (const pkg of trackedPackages) {
        if (!next.has(pkg)) {
          next.set(pkg, {
            name: pkg,
            results: [],
            loading: false,
            error: null,
            lastRefresh: null,
          });
        }
      }
      return next;
    });
  }, [trackedPackages]);

  // Fetch new packages that haven't been fetched yet
  useEffect(() => {
    for (const pkg of trackedPackages) {
      const existing = packages.get(pkg);
      if (!existing?.lastRefresh && !existing?.loading) {
        fetchPackage(pkg);
      }
    }
  }, [trackedPackages, packages, fetchPackage]);

  // Polling
  useEffect(() => {
    if (trackedPackages.length === 0) return;

    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll, trackedPackages.length]);

  const refetch = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    packages,
    refetch,
    fetchPackage,
  };
}
