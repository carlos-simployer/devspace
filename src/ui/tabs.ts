export interface TabDef {
  route: string; // root route path
  label: string; // display name
}

/** All available tabs in default order. Config is always last. */
const ALL_TABS: TabDef[] = [
  { route: "prs", label: "PRs" },
  { route: "jira", label: "Jira" },
  { route: "projects", label: "Projects" },
  { route: "pipelines", label: "Pipelines" },
  { route: "releases", label: "Releases" },
  { route: "dependencies", label: "Deps" },
  { route: "slack", label: "Slack" },
];

const CONFIG_TAB: TabDef = { route: "config", label: "Config" };

/** Current active tabs (set at startup from config). */
let activeTabs: TabDef[] = [...ALL_TABS, CONFIG_TAB];

/**
 * Set which tabs are enabled and in what order.
 * Called from App on config load. Empty array = all tabs in default order.
 * Config tab is always appended last.
 */
export function setActiveTabs(enabledRoutes: string[]): void {
  if (!enabledRoutes || enabledRoutes.length === 0) {
    activeTabs = [...ALL_TABS, CONFIG_TAB];
    return;
  }
  const tabs: TabDef[] = [];
  for (const route of enabledRoutes) {
    if (route === "config") continue; // config is always appended
    const def = ALL_TABS.find((t) => t.route === route);
    if (def) tabs.push(def);
  }
  activeTabs = [...tabs, CONFIG_TAB];
}

/** Current active tab definitions (read-only). */
export function getTabs(): TabDef[] {
  return activeTabs;
}

/** All possible tabs (for the config UI). */
export function getAllTabs(): TabDef[] {
  return ALL_TABS;
}

// Legacy export for backward compat — points to active tabs
export { activeTabs as TABS };

/** Get tab label with number prefix, e.g. "6 Jira" */
export function getTabLabel(route: string): string | undefined {
  const base = getBaseRoute(route);
  const idx = activeTabs.findIndex((t) => t.route === base);
  if (idx < 0) return undefined;
  return `${idx + 1} ${activeTabs[idx]!.label}`;
}

/** All tabs for the TabBar component. */
export function getTabViews(): Array<{ route: string; label: string }> {
  return activeTabs.map((t, i) => ({
    route: t.route,
    label: `${i + 1} ${t.label}`,
  }));
}

/** Number keys for tab switching: "1" -> "prs", "2" -> "dependencies", etc. */
export function getTabNumberKeys(): Record<string, string> {
  const map: Record<string, string> = {};
  activeTabs.forEach((t, i) => {
    map[String(i + 1)] = t.route;
  });
  return map;
}

/** Extract the base (top-level) route from a full route path.
 *  e.g. "jira/detail/UUX-1" -> "jira", "prs" -> "prs" */
export function getBaseRoute(route: string): string {
  const slash = route.indexOf("/");
  return slash < 0 ? route : route.slice(0, slash);
}
