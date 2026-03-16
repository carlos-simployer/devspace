import type {
  Config,
  ConfigV1,
  LocalProject,
  LocalProjectV1,
} from "../api/types.ts";

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
    slackChannels: [],
    enabledTabs: [],
  };
}

/** Migrate a v1 local project (single command) to v2 (commands array). */
export function migrateLocalProjectV1(old: LocalProjectV1): LocalProject {
  return {
    name: old.name,
    path: old.path,
    commands: [
      {
        name: "default",
        command: old.command,
        url: old.url,
        dependencies: old.dependencies,
      },
    ],
  };
}

/** Check if a project uses the old shape (has `command` string instead of `commands` array). */
export function isLocalProjectV1(project: any): project is LocalProjectV1 {
  return (
    typeof project === "object" &&
    project !== null &&
    typeof project.command === "string" &&
    !Array.isArray(project.commands)
  );
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
