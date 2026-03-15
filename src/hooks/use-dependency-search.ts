import { useState, useCallback, useEffect, useMemo } from "react";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { TrackedPackage, DependencyResult } from "../api/types.ts";
import { searchPackageUsage } from "../api/dependency-queries.ts";

const CACHE_MAX_AGE = 60 * 60_000; // 1 hour — skip fetch if cached within this

const CONFIG_DIR = join(homedir(), ".config", "devspace");
const CACHE_PATH = join(CONFIG_DIR, "dep-cache.json");

interface CacheEntry {
  results: DependencyResult[];
  timestamp: number;
}

type CacheData = Record<string, CacheEntry>;

function readCache(): CacheData {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeCache(data: CacheData) {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(data));
  } catch {
    // Best-effort
  }
}

function loadCachedPackages(
  trackedPackages: string[],
): Map<string, TrackedPackage> {
  const cache = readCache();
  const map = new Map<string, TrackedPackage>();

  for (const name of trackedPackages) {
    const entry = cache[name];
    if (entry && entry.results.length > 0) {
      map.set(name, {
        name,
        results: entry.results,
        loading: false,
        error: null,
        lastRefresh: new Date(entry.timestamp),
      });
    } else {
      map.set(name, {
        name,
        results: [],
        loading: false,
        error: null,
        lastRefresh: null,
      });
    }
  }

  return map;
}

export function useDependencySearch(
  token: string,
  orgs: string[],
  trackedPackages: string[],
) {
  const [packages, setPackages] = useState<Map<string, TrackedPackage>>(() =>
    loadCachedPackages(trackedPackages),
  );

  // Stabilize orgs reference to prevent effect cascades
  const orgsKey = orgs.join(",");
  const stableOrgs = useMemo(() => orgs, [orgsKey]);

  const fetchPackage = useCallback(
    async (packageName: string, force = false) => {
      if (stableOrgs.length === 0) return;

      // Skip if cache is fresh enough (unless forced)
      if (!force) {
        const cache = readCache();
        const entry = cache[packageName];
        if (entry && Date.now() - entry.timestamp < CACHE_MAX_AGE) {
          return;
        }
      }

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
        const results = await searchPackageUsage(
          token,
          stableOrgs,
          packageName,
        );

        // Write to disk cache
        const cache = readCache();
        cache[packageName] = { results, timestamp: Date.now() };
        writeCache(cache);

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
    [token, stableOrgs],
  );

  // Sync tracked packages with state (add new / remove old)
  useEffect(() => {
    setPackages((prev) => {
      const next = new Map(prev);
      const cache = readCache();
      for (const key of next.keys()) {
        if (!trackedPackages.includes(key)) next.delete(key);
      }
      for (const pkg of trackedPackages) {
        if (!next.has(pkg)) {
          const entry = cache[pkg];
          if (entry && entry.results.length > 0) {
            next.set(pkg, {
              name: pkg,
              results: entry.results,
              loading: false,
              error: null,
              lastRefresh: new Date(entry.timestamp),
            });
          } else {
            next.set(pkg, {
              name: pkg,
              results: [],
              loading: false,
              error: null,
              lastRefresh: null,
            });
          }
        }
      }
      return next;
    });
  }, [trackedPackages]);

  return {
    packages,
    fetchPackage,
  };
}
