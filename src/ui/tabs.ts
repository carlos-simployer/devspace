export interface TabDef {
  route: string; // root route path
  label: string; // display name
}

export const TABS: TabDef[] = [
  { route: "prs", label: "PRs" },
  { route: "dependencies", label: "Deps" },
  { route: "pipelines", label: "Pipelines" },
  { route: "releases", label: "Releases" },
  { route: "projects", label: "Projects" },
  { route: "jira", label: "Jira" },
  { route: "config", label: "Config" },
];

/** Get tab label with number prefix, e.g. "6 Jira" */
export function getTabLabel(route: string): string | undefined {
  const base = getBaseRoute(route);
  const idx = TABS.findIndex((t) => t.route === base);
  if (idx < 0) return undefined;
  return `${idx + 1} ${TABS[idx]!.label}`;
}

/** All tabs for the TabBar component. */
export function getTabViews(): Array<{ route: string; label: string }> {
  return TABS.map((t, i) => ({
    route: t.route,
    label: `${i + 1} ${t.label}`,
  }));
}

/** Number keys for tab switching: "1" -> "prs", "2" -> "dependencies", etc. */
export function getTabNumberKeys(): Record<string, string> {
  const map: Record<string, string> = {};
  TABS.forEach((t, i) => {
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
