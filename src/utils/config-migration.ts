import type { Config, ConfigV1 } from "../api/types.ts";

export const DEFAULT_REFRESH_INTERVAL = 60;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function migrateV1toV2(v1: ConfigV1): Config {
  return {
    version: 2,
    orgs: v1.org ? [v1.org] : [],
    activeOrg: v1.org || "",
    repos: v1.repos.map((r) => (r.includes("/") ? r : `${v1.org}/${r}`)),
    lastViewed: {},
    trackedPackages: v1.trackedPackages ?? [],
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
    githubToken: "",
    azureToken: "",
  };
}

export function pruneLastViewed(
  lastViewed: Record<string, number>,
): Record<string, number> {
  const now = Date.now();
  const pruned: Record<string, number> = {};
  for (const [key, value] of Object.entries(lastViewed)) {
    if (now - value < THIRTY_DAYS_MS) {
      pruned[key] = value;
    }
  }
  return pruned;
}
