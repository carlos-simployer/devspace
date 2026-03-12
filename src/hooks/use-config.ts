import { useState, useCallback, useEffect } from "react";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Config } from "../api/types.ts";

const CONFIG_DIR = join(homedir(), ".config", "github-pr-dash");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function readRawConfig(): Record<string, any> | null {
  try {
    if (!existsSync(CONFIG_PATH)) return null;
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function readConfig(): Config | null {
  const raw = readRawConfig();
  if (!raw) return null;
  return {
    org: raw.org ?? raw.activeOrg ?? "",
    repos: raw.repos ?? [],
    trackedPackages: raw.trackedPackages ?? [],
  };
}

function writeConfig(config: Config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  // Merge with existing file to preserve other fields
  const existing = readRawConfig() ?? {};
  const merged = {
    ...existing,
    org: config.org,
    repos: config.repos,
    trackedPackages: config.trackedPackages,
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
}

export function useConfig(orgArg?: string) {
  const [config, setConfigState] = useState<Config>(() => {
    const saved = readConfig();
    const org = orgArg || process.env.GITHUB_ORG || saved?.org || "";
    return {
      org,
      repos: (saved?.repos ?? []).sort((a, b) => a.localeCompare(b)),
      trackedPackages: saved?.trackedPackages ?? [],
    };
  });

  const isFirstLaunch = config.repos.length === 0;

  const setConfig = useCallback((updater: (prev: Config) => Config) => {
    setConfigState((prev) => {
      const next = updater(prev);
      writeConfig(next);
      return next;
    });
  }, []);

  const addRepo = useCallback(
    (repo: string) => {
      setConfig((prev) => {
        if (prev.repos.includes(repo)) return prev;
        return { ...prev, repos: [...prev.repos, repo].sort() };
      });
    },
    [setConfig],
  );

  const removeRepo = useCallback(
    (repo: string) => {
      setConfig((prev) => ({
        ...prev,
        repos: prev.repos.filter((r) => r !== repo),
      }));
    },
    [setConfig],
  );

  const addPackage = useCallback(
    (pkg: string) => {
      setConfig((prev) => {
        if (prev.trackedPackages.includes(pkg)) return prev;
        return {
          ...prev,
          trackedPackages: [...prev.trackedPackages, pkg].sort(),
        };
      });
    },
    [setConfig],
  );

  const removePackage = useCallback(
    (pkg: string) => {
      setConfig((prev) => ({
        ...prev,
        trackedPackages: prev.trackedPackages.filter((p) => p !== pkg),
      }));
    },
    [setConfig],
  );

  // Save initial config if org changed
  useEffect(() => {
    if (orgArg && orgArg !== readConfig()?.org) {
      writeConfig(config);
    }
  }, [orgArg, config]);

  return {
    config,
    addRepo,
    removeRepo,
    addPackage,
    removePackage,
    isFirstLaunch,
  };
}
