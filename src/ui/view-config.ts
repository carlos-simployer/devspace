export type ViewId =
  | "prs"
  | "prs.help"
  | "prs.detail"
  | "prs.notifications"
  | "prs.search"
  | "dependencies"
  | "dependencies.help"
  | "dependencies.search"
  | "pipelines"
  | "pipelines.help"
  | "pipelines.search"
  | "pipelines.runs"
  | "releases"
  | "releases.help"
  | "releases.search"
  | "projects"
  | "projects.help"
  | "projects.add"
  | "projects.confirm"
  | "jira"
  | "jira.help"
  | "jira.detail"
  | "jira.search"
  | "jira.memberSelect"
  | "jira.statusFilter"
  | "jira.sort"
  | "config"
  | "config.addOrg"
  | "config.editAzureOrg"
  | "config.editAzureProject"
  | "config.editJiraSite"
  | "config.editJiraEmail"
  | "config.editJiraToken"
  | "config.editJiraProject";

export type BaseView =
  | "prs"
  | "dependencies"
  | "pipelines"
  | "releases"
  | "projects"
  | "jira"
  | "config";

export function getBaseView(viewId: ViewId): BaseView {
  return viewId.split(".")[0] as BaseView;
}

export interface ViewDef {
  /** Tab label (e.g. "1 PRs"). Only for top-level views. */
  tab?: string;
  /** Shortcut action names to show in the bottom bar. */
  bar: string[];
}

export const VIEW_CONFIG: Record<string, ViewDef> = {
  // --- PRs ---
  prs: {
    tab: "1 PRs",
    bar: [
      "open",
      "detail",
      "copyUrl",
      "sort",
      "notifications",
      "filterMine",
      "filterReview",
      "filterAll",
      "help",
    ],
  },
  "prs.detail": {
    bar: ["close", "switchTab", "open"],
  },
  "prs.help": { bar: [] },
  "prs.notifications": {
    bar: ["close", "open"],
  },
  "prs.search": { bar: [] },

  // --- Dependencies ---
  dependencies: {
    tab: "2 Deps",
    bar: ["add", "remove", "refresh", "open", "help"],
  },
  "dependencies.help": { bar: [] },
  "dependencies.search": { bar: [] },

  // --- Pipelines ---
  pipelines: {
    tab: "3 Pipelines",
    bar: ["add", "remove", "runs", "open", "refresh", "help"],
  },
  "pipelines.help": { bar: [] },
  "pipelines.search": { bar: [] },
  "pipelines.runs": {
    bar: ["close", "open"],
  },

  // --- Releases ---
  releases: {
    tab: "4 Releases",
    bar: ["add", "remove", "open", "refresh", "help"],
  },
  "releases.help": { bar: [] },
  "releases.search": { bar: [] },

  // --- Projects ---
  projects: {
    tab: "5 Projects",
    bar: [
      "start",
      "kill",
      "restart",
      "open",
      "add",
      "remove",
      "scrollLogs",
      "startAll",
      "help",
    ],
  },
  "projects.help": { bar: [] },
  "projects.add": { bar: [] },
  "projects.confirm": { bar: [] },

  // --- Jira ---
  jira: {
    tab: "6 Jira",
    bar: [
      "open",
      "filterMine",
      "filterTeam",
      "filterPerson",
      "filterStatus",
      "sort",
      "search",
      "refresh",
      "help",
    ],
  },
  "jira.detail": {
    bar: ["close", "open"],
  },
  "jira.help": { bar: [] },
  "jira.search": { bar: [] },
  "jira.statusFilter": { bar: [] },
  "jira.sort": { bar: [] },
  "jira.memberSelect": { bar: [] },

  // --- Config (always last) ---
  config: {
    tab: "7 Config",
    bar: ["add", "remove", "select", "editConfig", "help"],
  },
  "config.addOrg": { bar: [] },
  "config.editAzureOrg": { bar: [] },
  "config.editAzureProject": { bar: [] },
  "config.editJiraSite": { bar: [] },
  "config.editJiraEmail": { bar: [] },
  "config.editJiraToken": { bar: [] },
  "config.editJiraProject": { bar: [] },
};

/** Resolve tab label — walks up to parent if not defined. */
export function getTabLabel(viewId: ViewId): string | undefined {
  const config = VIEW_CONFIG[viewId];
  if (config?.tab) return config.tab;
  return VIEW_CONFIG[getBaseView(viewId)]?.tab;
}

/** All top-level views with tabs (for TabBar). */
export function getTabViews(): Array<{ key: BaseView; label: string }> {
  return Object.entries(VIEW_CONFIG)
    .filter(([_, val]) => val.tab)
    .map(([key, val]) => ({ key: key as BaseView, label: val.tab! }));
}

/** Number keys for tab switching (derived from tab labels). */
export function getTabNumberKeys(): Record<string, BaseView> {
  const map: Record<string, BaseView> = {};
  for (const { key, label } of getTabViews()) {
    const num = label.match(/^(\d)/);
    if (num) map[num[1]!] = key;
  }
  return map;
}
