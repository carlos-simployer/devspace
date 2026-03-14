import { useState, useCallback, useEffect } from "react";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Config, ConfigV1, LocalProject } from "../api/types.ts";
import {
  DEFAULT_REFRESH_INTERVAL,
  migrateV1toV2,
  pruneLastViewed,
} from "../utils/config-migration.ts";
import { setTheme, type ThemeName } from "../ui/theme.ts";

const CONFIG_DIR = join(homedir(), ".config", "github-pr-dash");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function readRawConfig(): any {
  try {
    if (!existsSync(CONFIG_PATH)) return null;
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeConfig(config: Config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  // Merge with existing file to preserve any extra fields
  const existing = readRawConfig() ?? {};
  const toWrite = {
    ...existing,
    ...config,
    lastViewed: pruneLastViewed(config.lastViewed),
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(toWrite, null, 2));
}

export function useConfig(orgArg?: string) {
  const [config, setConfigState] = useState<Config>(() => {
    const raw = readRawConfig();

    // No saved config
    if (!raw) {
      const org = orgArg || process.env.GITHUB_ORG || "";
      return {
        version: 2 as const,
        orgs: org ? [org] : [],
        activeOrg: org,
        repos: [],
        lastViewed: {},
        trackedPackages: [],
        refreshInterval: DEFAULT_REFRESH_INTERVAL,
        theme: "default",
        azureOrg: "",
        azureProject: "",
        pinnedPipelines: [],
        pinnedReleaseDefinitions: [],
        localProjects: [],
        persistCache: true,
        jiraSite: "",
        jiraEmail: "",
        jiraToken: "",
        jiraProject: "",
        jiraStatusOrder: [
          "In Progress",
          "Blocked",
          "In Review",
          "Ready for Test",
          "To Do",
          "Done",
        ],
        jiraAccountId: "",
      };
    }

    // V1 config (no version field)
    if (!raw.version) {
      const v1: ConfigV1 = {
        org: raw.org || "",
        repos: raw.repos || [],
        trackedPackages: raw.trackedPackages || [],
      };
      const v2 = migrateV1toV2(v1);
      if (orgArg) {
        v2.activeOrg = orgArg;
        if (!v2.orgs.includes(orgArg)) v2.orgs.push(orgArg);
      }
      writeConfig(v2);
      return v2;
    }

    // V2 config
    const cfg: Config = {
      version: 2,
      orgs: raw.orgs || [],
      activeOrg: orgArg || raw.activeOrg || "",
      repos: (raw.repos || []).sort((a: string, b: string) =>
        a.localeCompare(b),
      ),
      lastViewed: raw.lastViewed || {},
      trackedPackages: raw.trackedPackages || [],
      refreshInterval: raw.refreshInterval || DEFAULT_REFRESH_INTERVAL,
      theme: raw.theme || "default",
      azureOrg: raw.azureOrg || "",
      azureProject: raw.azureProject || "",
      pinnedPipelines: raw.pinnedPipelines || [],
      pinnedReleaseDefinitions: raw.pinnedReleaseDefinitions || [],
      localProjects: raw.localProjects || [],
      persistCache: raw.persistCache !== false, // default true
      jiraSite: raw.jiraSite || "",
      jiraEmail: raw.jiraEmail || "",
      jiraToken: raw.jiraToken || "",
      jiraProject: raw.jiraProject || "",
      jiraStatusOrder: raw.jiraStatusOrder || [
        "In Progress",
        "Blocked",
        "In Review",
        "Ready for Test",
        "To Do",
        "Done",
      ],
      jiraAccountId: raw.jiraAccountId || "",
    };

    if (orgArg && !cfg.orgs.includes(orgArg)) {
      cfg.orgs.push(orgArg);
    }

    return cfg;
  });

  // Sync theme module state on init
  setTheme((config.theme || "default") as ThemeName);

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
        const qualified = repo.includes("/")
          ? repo
          : `${prev.activeOrg}/${repo}`;
        if (prev.repos.includes(qualified)) return prev;
        return { ...prev, repos: [...prev.repos, qualified].sort() };
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

  const addOrg = useCallback(
    (org: string) => {
      setConfig((prev) => {
        if (prev.orgs.includes(org)) return prev;
        return { ...prev, orgs: [...prev.orgs, org], activeOrg: org };
      });
    },
    [setConfig],
  );

  const removeOrg = useCallback(
    (org: string) => {
      setConfig((prev) => {
        const orgs = prev.orgs.filter((o) => o !== org);
        const repos = prev.repos.filter((r) => !r.startsWith(`${org}/`));
        const activeOrg =
          prev.activeOrg === org ? (orgs[0] ?? "") : prev.activeOrg;
        return { ...prev, orgs, repos, activeOrg };
      });
    },
    [setConfig],
  );

  const setActiveOrg = useCallback(
    (org: string) => {
      setConfig((prev) => ({ ...prev, activeOrg: org }));
    },
    [setConfig],
  );

  const setRefreshInterval = useCallback(
    (seconds: number) => {
      setConfig((prev) => ({ ...prev, refreshInterval: seconds }));
    },
    [setConfig],
  );

  const markViewed = useCallback(
    (prId: string) => {
      setConfig((prev) => ({
        ...prev,
        lastViewed: { ...prev.lastViewed, [prId]: Date.now() },
      }));
    },
    [setConfig],
  );

  const setThemeName = useCallback(
    (theme: string) => {
      setTheme(theme as ThemeName);
      setConfig((prev) => ({ ...prev, theme }));
    },
    [setConfig],
  );

  const setAzureOrg = useCallback(
    (azureOrg: string) => {
      setConfig((prev) => ({ ...prev, azureOrg }));
    },
    [setConfig],
  );

  const setAzureProject = useCallback(
    (azureProject: string) => {
      setConfig((prev) => ({ ...prev, azureProject }));
    },
    [setConfig],
  );

  const addPinnedPipeline = useCallback(
    (id: number) => {
      setConfig((prev) => {
        if (prev.pinnedPipelines.includes(id)) return prev;
        return { ...prev, pinnedPipelines: [...prev.pinnedPipelines, id] };
      });
    },
    [setConfig],
  );

  const removePinnedPipeline = useCallback(
    (id: number) => {
      setConfig((prev) => ({
        ...prev,
        pinnedPipelines: prev.pinnedPipelines.filter((p) => p !== id),
      }));
    },
    [setConfig],
  );

  const addPinnedReleaseDefinition = useCallback(
    (id: number) => {
      setConfig((prev) => {
        if (prev.pinnedReleaseDefinitions.includes(id)) return prev;
        return {
          ...prev,
          pinnedReleaseDefinitions: [...prev.pinnedReleaseDefinitions, id],
        };
      });
    },
    [setConfig],
  );

  const removePinnedReleaseDefinition = useCallback(
    (id: number) => {
      setConfig((prev) => ({
        ...prev,
        pinnedReleaseDefinitions: prev.pinnedReleaseDefinitions.filter(
          (p) => p !== id,
        ),
      }));
    },
    [setConfig],
  );

  const addLocalProject = useCallback(
    (project: LocalProject) => {
      setConfig((prev) => {
        if (prev.localProjects.some((p) => p.name === project.name))
          return prev;
        return {
          ...prev,
          localProjects: [...prev.localProjects, project],
        };
      });
    },
    [setConfig],
  );

  const removeLocalProject = useCallback(
    (name: string) => {
      setConfig((prev) => ({
        ...prev,
        localProjects: prev.localProjects
          .filter((p) => p.name !== name)
          .map((p) => ({
            ...p,
            dependencies: p.dependencies.filter((d) => d !== name),
          })),
      }));
    },
    [setConfig],
  );

  const updateLocalProject = useCallback(
    (name: string, updates: Partial<LocalProject>) => {
      setConfig((prev) => ({
        ...prev,
        localProjects: prev.localProjects.map((p) =>
          p.name === name ? { ...p, ...updates } : p,
        ),
      }));
    },
    [setConfig],
  );

  const setPersistCache = useCallback(
    (enabled: boolean) => {
      setConfig((prev) => ({ ...prev, persistCache: enabled }));
    },
    [setConfig],
  );

  const setJiraSite = useCallback(
    (jiraSite: string) => {
      setConfig((prev) => ({ ...prev, jiraSite }));
    },
    [setConfig],
  );

  const setJiraEmail = useCallback(
    (jiraEmail: string) => {
      setConfig((prev) => ({ ...prev, jiraEmail }));
    },
    [setConfig],
  );

  const setJiraToken = useCallback(
    (jiraToken: string) => {
      setConfig((prev) => ({ ...prev, jiraToken }));
    },
    [setConfig],
  );

  const setJiraProject = useCallback(
    (jiraProject: string) => {
      setConfig((prev) => ({ ...prev, jiraProject }));
    },
    [setConfig],
  );

  const setJiraAccountId = useCallback(
    (jiraAccountId: string) => {
      setConfig((prev) => ({ ...prev, jiraAccountId }));
    },
    [setConfig],
  );

  // Save initial config if org changed
  useEffect(() => {
    if (orgArg) {
      const raw = readRawConfig();
      if (!raw || raw.activeOrg !== orgArg) {
        writeConfig(config);
      }
    }
  }, [orgArg, config]);

  return {
    config,
    addRepo,
    removeRepo,
    addPackage,
    removePackage,
    addOrg,
    removeOrg,
    setActiveOrg,
    setRefreshInterval,
    markViewed,
    setThemeName,
    setAzureOrg,
    setAzureProject,
    addPinnedPipeline,
    removePinnedPipeline,
    addPinnedReleaseDefinition,
    removePinnedReleaseDefinition,
    addLocalProject,
    removeLocalProject,
    updateLocalProject,
    setPersistCache,
    setJiraSite,
    setJiraEmail,
    setJiraToken,
    setJiraProject,
    setJiraAccountId,
    isFirstLaunch,
  };
}
