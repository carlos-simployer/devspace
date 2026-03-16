import { getBaseRoute } from "./tabs.ts";

export interface ShortcutDef {
  action: string;
  key: string; // character or special: "tab", "return", "escape", "up", "down", etc.
  label?: string; // shown in bar
  help: string; // shown in help overlay
}

// Key translation for Ink's useInput
interface InkKey {
  return?: boolean;
  escape?: boolean;
  tab?: boolean;
  shift?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  backspace?: boolean;
  delete?: boolean;
}

/** Check if a shortcut key matches the ink useInput arguments */
export function matchKey(
  shortcutKey: string,
  input: string,
  key: InkKey,
): boolean {
  switch (shortcutKey) {
    case "return":
      return !!key.return;
    case "escape":
      return !!key.escape;
    case "tab":
      return !!key.tab && !key.shift;
    case "shift+tab":
      return !!key.tab && !!key.shift;
    case "up":
      return !!key.upArrow;
    case "down":
      return !!key.downArrow;
    case "left":
      return !!key.leftArrow;
    case "right":
      return !!key.rightArrow;
    case "backspace":
      return !!key.backspace;
    case "delete":
      return !!key.delete;
    default:
      return input === shortcutKey;
  }
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const KEY_DISPLAY: Record<string, string> = {
  escape: "esc",
  return: "enter",
  tab: "tab",
  "shift+tab": "shift+tab",
  up: "\u2191",
  down: "\u2193",
  left: "\u2190",
  right: "\u2192",
  backspace: "bksp",
  delete: "del",
};

export function displayKey(key: string): string {
  return KEY_DISPLAY[key] ?? key;
}

// ---------------------------------------------------------------------------
// Bar definitions: which actions to show in the bottom bar per route
// ---------------------------------------------------------------------------

const ROUTE_BAR: Record<string, string[]> = {
  prs: [
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
  "prs/detail": ["close", "switchTab", "open"],
  "prs/help": [],
  "prs/notifications": ["close", "open"],
  "prs/search": [],

  dependencies: ["add", "remove", "refresh", "open", "help"],
  "dependencies/help": [],
  "dependencies/search": [],

  pipelines: ["add", "remove", "runs", "open", "refresh", "help"],
  "pipelines/help": [],
  "pipelines/search": [],
  "pipelines/runs": ["close", "open"],

  releases: ["add", "remove", "open", "refresh", "help"],
  "releases/help": [],
  "releases/search": [],

  projects: [
    "start",
    "kill",
    "restart",
    "open",
    "add",
    "remove",
    "scrollLogs",
    "startAll",
    "openInVscode",
    "openClaude",
    "help",
  ],
  "projects/help": [],
  "projects/add": [],

  jira: [
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
  "jira/detail": ["close", "open"],
  "jira/help": [],
  "jira/statusFilter": [],
  "jira/sort": [],
  "jira/memberSelect": [],

  slack: [
    "compose",
    "thread",
    "react",
    "open",
    "add",
    "status",
    "refresh",
    "help",
  ],
  "slack/thread": ["close", "reply", "react", "open"],
  "slack/help": [],
  "slack/search": [],
  "slack/emoji": [],
  "slack/status": [],

  config: ["add", "remove", "select", "open", "editConfig", "help"],

  // Log overlays (all views)
  "prs/logs": [],
  "dependencies/logs": [],
  "pipelines/logs": [],
  "releases/logs": [],
  "projects/logs": [],
  "jira/logs": [],
  "slack/logs": [],
  "config/logs": [],
};

// ---------------------------------------------------------------------------
// All shortcuts grouped by route path
// ---------------------------------------------------------------------------

const _logShortcuts: Record<string, ShortcutDef> = {
  escape: { action: "close", key: "escape", help: "Close logs" },
  c: { action: "clearLogs", key: "c", help: "Clear log entries" },
  up: { action: "up", key: "up", help: "Scroll up" },
  down: { action: "down", key: "down", help: "Scroll down" },
};

export const ROUTE_SHORTCUTS: Record<string, Record<string, ShortcutDef>> = {
  // ── Global ────────────────────────────────────────────────────────────
  _global: {
    q: { action: "quit", key: "q", help: "Quit" },
    "?": { action: "help", key: "?", help: "Toggle help" },
    L: { action: "logs", key: "L", help: "Toggle logs" },
    tab: { action: "nextView", key: "tab", help: "Next view" },
    "shift+tab": {
      action: "prevView",
      key: "shift+tab",
      help: "Previous view",
    },
  },

  // ── PRs ───────────────────────────────────────────────────────────────
  prs: {
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open PR in browser",
    },
    p: {
      action: "detail",
      key: "p",
      label: "Detail",
      help: "Open PR detail panel",
    },
    y: {
      action: "copyUrl",
      key: "y",
      label: "Copy",
      help: "Copy PR URL",
    },
    Y: { action: "copyBranch", key: "Y", help: "Copy branch name" },
    S: {
      action: "sort",
      key: "S",
      label: "Sort",
      help: "Cycle sort mode",
    },
    n: {
      action: "notifications",
      key: "n",
      label: "Notif",
      help: "Toggle notifications",
    },
    m: {
      action: "filterMine",
      key: "m",
      label: "My PRs",
      help: "Filter: my PRs",
    },
    s: {
      action: "filterReview",
      key: "s",
      label: "To Review",
      help: "Filter: review requested",
    },
    t: {
      action: "filterAll",
      key: "t",
      label: "All",
      help: "Filter: all PRs",
    },
    c: { action: "filterClosed", key: "c", help: "Filter: closed/merged" },
    R: { action: "refresh", key: "R", help: "Force refresh" },
    "+": { action: "add", key: "+", help: "Add repo" },
    "/": { action: "search", key: "/", help: "Search/filter PRs" },
    d: { action: "remove", key: "d", help: "Remove selected repo" },
    r: { action: "openRepo", key: "r", help: "Open repo in browser" },
    a: { action: "openActions", key: "a", help: "Open Actions tab" },
    A: { action: "approve", key: "A", help: "Approve PR" },
    C: { action: "comment", key: "C", help: "Comment on PR" },
    X: { action: "requestChanges", key: "X", help: "Request changes" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Focus sidebar" },
    right: { action: "right", key: "right", help: "Focus list" },
    return: { action: "select", key: "return", help: "Select" },
    escape: {
      action: "clearSearch",
      key: "escape",
      help: "Clear search / close",
    },
  },

  // ── PR Detail ─────────────────────────────────────────────────────────
  "prs/detail": {
    escape: {
      action: "close",
      key: "escape",
      label: "Close",
      help: "Close panel",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    tab: {
      action: "switchTab",
      key: "tab",
      label: "Tab",
      help: "Switch tab",
    },
    f: { action: "filesTab", key: "f", help: "Files tab" },
    d: { action: "overviewTab", key: "d", help: "Overview tab" },
    up: { action: "up", key: "up", help: "Scroll up" },
    down: { action: "down", key: "down", help: "Scroll down" },
    return: {
      action: "select",
      key: "return",
      help: "Expand/collapse file",
    },
  },

  // ── PR Notifications ──────────────────────────────────────────────────
  "prs/notifications": {
    escape: {
      action: "close",
      key: "escape",
      label: "Close",
      help: "Close",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    return: { action: "select", key: "return", help: "Open in browser" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Dependencies ──────────────────────────────────────────────────────
  dependencies: {
    "+": {
      action: "add",
      key: "+",
      label: "Add",
      help: "Add package to track",
    },
    d: {
      action: "remove",
      key: "d",
      label: "Remove",
      help: "Remove package",
    },
    R: {
      action: "refresh",
      key: "R",
      label: "Refresh",
      help: "Force refresh",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    return: { action: "select", key: "return", help: "Select" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Focus packages" },
    right: { action: "right", key: "right", help: "Focus results" },
  },

  // ── Pipelines ─────────────────────────────────────────────────────────
  pipelines: {
    "+": {
      action: "add",
      key: "+",
      label: "Add",
      help: "Add pipeline",
    },
    d: {
      action: "remove",
      key: "d",
      label: "Remove",
      help: "Remove pipeline",
    },
    p: {
      action: "runs",
      key: "p",
      label: "Runs",
      help: "View pipeline runs",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    R: {
      action: "refresh",
      key: "R",
      label: "Refresh",
      help: "Force refresh",
    },
    return: { action: "select", key: "return", help: "Select" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Focus sidebar" },
    right: { action: "right", key: "right", help: "Focus list" },
  },

  // ── Pipeline Runs ─────────────────────────────────────────────────────
  "pipelines/runs": {
    escape: {
      action: "close",
      key: "escape",
      label: "Close",
      help: "Close runs",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Releases ──────────────────────────────────────────────────────────
  releases: {
    "+": {
      action: "add",
      key: "+",
      label: "Add",
      help: "Add release definition",
    },
    d: {
      action: "remove",
      key: "d",
      label: "Remove",
      help: "Remove definition",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    R: {
      action: "refresh",
      key: "R",
      label: "Refresh",
      help: "Refresh",
    },
    return: { action: "select", key: "return", help: "Select" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Focus sidebar" },
    right: { action: "right", key: "right", help: "Focus list" },
  },

  // ── Projects ──────────────────────────────────────────────────────────
  projects: {
    s: {
      action: "start",
      key: "s",
      label: "Start",
      help: "Start project (with deps)",
    },
    K: {
      action: "kill",
      key: "K",
      label: "Kill",
      help: "Kill project",
    },
    R: {
      action: "restart",
      key: "R",
      label: "Restart",
      help: "Restart project",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open URL in browser",
    },
    "+": {
      action: "add",
      key: "+",
      label: "Add",
      help: "Add project",
    },
    d: {
      action: "remove",
      key: "d",
      label: "Remove",
      help: "Remove project",
    },
    "[ ]": {
      action: "scrollLogs",
      key: "[ ]",
      label: "Scroll Logs",
      help: "Scroll logs",
    },
    S: {
      action: "startAll",
      key: "S",
      label: "Start All",
      help: "Start all projects",
    },
    "]": { action: "scrollDown", key: "]", help: "Scroll logs down" },
    "[": { action: "scrollUp", key: "[", help: "Scroll logs up" },
    "}": { action: "pageDown", key: "}", help: "Page down logs" },
    "{": { action: "pageUp", key: "{", help: "Page up logs" },
    g: { action: "logTop", key: "g", help: "Logs: jump to top" },
    G: { action: "logBottom", key: "G", help: "Logs: jump to bottom" },
    c: { action: "clearLogs", key: "c", help: "Clear logs" },
    V: {
      action: "openInVscode",
      key: "V",
      label: "VS Code",
      help: "Open project folder in VS Code",
    },
    C: {
      action: "openClaude",
      key: "C",
      label: "Claude",
      help: "Open Claude Code in new terminal tab",
    },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Jira ──────────────────────────────────────────────────────────────
  jira: {
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open issue in browser",
    },
    return: { action: "detail", key: "return", help: "Open issue detail" },
    m: {
      action: "filterMine",
      key: "m",
      label: "Mine",
      help: "Filter: my issues",
    },
    t: {
      action: "filterTeam",
      key: "t",
      label: "Team",
      help: "Filter: all team",
    },
    u: {
      action: "filterPerson",
      key: "u",
      label: "User",
      help: "Filter: select person",
    },
    "/": { action: "search", key: "/", help: "Search/filter issues" },
    R: {
      action: "refresh",
      key: "R",
      label: "Refresh",
      help: "Force refresh",
    },
    f: {
      action: "filterStatus",
      key: "f",
      label: "Status",
      help: "Filter by status",
    },
    s: {
      action: "sort",
      key: "s",
      label: "Sort",
      help: "Cycle sort mode",
    },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    escape: {
      action: "clearSearch",
      key: "escape",
      help: "Clear search / close",
    },
  },

  // ── Jira Sort ─────────────────────────────────────────────────────────
  "jira/sort": {
    escape: { action: "close", key: "escape", help: "Cancel" },
    return: { action: "select", key: "return", help: "Apply" },
    " ": { action: "toggle", key: " ", help: "Toggle field" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Jira Status Filter ────────────────────────────────────────────────
  "jira/statusFilter": {
    escape: { action: "close", key: "escape", help: "Close" },
    return: { action: "select", key: "return", help: "Toggle all" },
    " ": { action: "toggle", key: " ", help: "Toggle status" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Jira Detail ───────────────────────────────────────────────────────
  "jira/detail": {
    escape: {
      action: "close",
      key: "escape",
      label: "Close",
      help: "Close detail",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in browser",
    },
    d: { action: "overviewTab", key: "d", help: "Details tab" },
    c: { action: "commentsTab", key: "c", help: "Comments tab" },
    s: { action: "subtasksTab", key: "s", help: "Subtasks tab" },
    up: { action: "up", key: "up", help: "Scroll up" },
    down: { action: "down", key: "down", help: "Scroll down" },
  },

  // ── Jira Member Select ────────────────────────────────────────────────
  "jira/memberSelect": {
    escape: { action: "close", key: "escape", help: "Cancel" },
    return: { action: "select", key: "return", help: "Apply" },
    " ": { action: "toggle", key: " ", help: "Toggle member" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Slack ─────────────────────────────────────────────────────────────
  slack: {
    n: {
      action: "compose",
      key: "n",
      label: "Compose",
      help: "Compose new message",
    },
    r: {
      action: "thread",
      key: "r",
      label: "Thread",
      help: "Open thread / reply",
    },
    e: {
      action: "react",
      key: "e",
      label: "React",
      help: "Add emoji reaction",
    },
    d: { action: "delete", key: "d", help: "Delete own message" },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in Slack app",
    },
    "+": {
      action: "add",
      key: "+",
      label: "Add",
      help: "Add channel",
    },
    x: { action: "remove", key: "x", help: "Remove channel" },
    s: {
      action: "status",
      key: "s",
      label: "Status",
      help: "Set status",
    },
    p: { action: "presence", key: "p", help: "Toggle presence" },
    R: {
      action: "refresh",
      key: "R",
      label: "Refresh",
      help: "Force refresh",
    },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Focus sidebar" },
    right: { action: "right", key: "right", help: "Focus list" },
    return: { action: "select", key: "return", help: "Select / reply" },
    escape: { action: "escape", key: "escape", help: "Cancel" },
  },

  // ── Slack Thread ────────────────────────────────────────────────────
  "slack/thread": {
    escape: {
      action: "close",
      key: "escape",
      label: "Close",
      help: "Back to channel",
    },
    n: {
      action: "reply",
      key: "n",
      label: "Reply",
      help: "Reply in thread",
    },
    e: {
      action: "react",
      key: "e",
      label: "React",
      help: "Add reaction",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open in Slack app",
    },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Slack Emoji Picker ──────────────────────────────────────────────
  "slack/emoji": {
    escape: { action: "close", key: "escape", help: "Cancel" },
    return: { action: "select", key: "return", help: "Apply reaction" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Navigate left" },
    right: { action: "right", key: "right", help: "Navigate right" },
  },

  // ── Slack Status ────────────────────────────────────────────────────
  "slack/status": {
    escape: { action: "close", key: "escape", help: "Cancel" },
    return: { action: "select", key: "return", help: "Apply status" },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
  },

  // ── Log Overlay (shared by all views) ─────────────────────────────────
  "prs/logs": _logShortcuts,
  "dependencies/logs": _logShortcuts,
  "pipelines/logs": _logShortcuts,
  "releases/logs": _logShortcuts,
  "projects/logs": _logShortcuts,
  "jira/logs": _logShortcuts,
  "slack/logs": _logShortcuts,
  "config/logs": _logShortcuts,

  // ── Config ────────────────────────────────────────────────────────────
  config: {
    "+": {
      action: "add",
      key: "+",
      label: "Add",
      help: "Add organization",
    },
    d: {
      action: "remove",
      key: "d",
      label: "Remove",
      help: "Remove organization",
    },
    return: {
      action: "select",
      key: "return",
      label: "Select",
      help: "Select / edit",
    },
    e: {
      action: "editConfig",
      key: "e",
      label: "Edit",
      help: "Open config in VS Code",
    },
    o: {
      action: "open",
      key: "o",
      label: "Open",
      help: "Open directory in Finder",
    },
    up: { action: "up", key: "up", help: "Navigate up" },
    down: { action: "down", key: "down", help: "Navigate down" },
    left: { action: "left", key: "left", help: "Previous section" },
    right: { action: "right", key: "right", help: "Next section" },
  },
};

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Get all shortcuts for a specific route (own shortcuts only, not globals). */
export function getRouteShortcuts(route: string): Record<string, ShortcutDef> {
  return ROUTE_SHORTCUTS[route] ?? {};
}

/**
 * Strip :param segments from a matched route pattern to get the shortcut key.
 * e.g. "jira/detail/:key" -> "jira/detail"
 *      "jira" -> "jira" (unchanged)
 *      "config/edit/:field" -> "config/edit"
 */
export function getShortcutRoute(matchedPath: string): string {
  return matchedPath
    .split("/")
    .filter((seg) => !seg.startsWith(":"))
    .join("/");
}

/** Get shortcuts for the bottom bar of a route. */
export function getBarShortcuts(
  route: string,
  matchedPath?: string,
): Array<{ key: string; label: string }> {
  const lookupRoute = matchedPath ? getShortcutRoute(matchedPath) : route;
  // Try exact route first, then fall back to base route
  const barActions =
    ROUTE_BAR[lookupRoute] ?? ROUTE_BAR[getBaseRoute(lookupRoute)] ?? [];
  if (barActions.length === 0) return [];

  const base = getBaseRoute(lookupRoute);
  const result: Array<{ key: string; label: string }> = [];

  for (const actionName of barActions) {
    // Search in the route's shortcuts, then base route, then globals
    const def =
      findShortcutByAction(actionName, lookupRoute) ??
      findShortcutByAction(actionName, base) ??
      findShortcutByAction(actionName, "_global");
    if (def?.label) {
      result.push({ key: displayKey(def.key), label: def.label });
    }
  }
  return result;
}

/** Get shortcuts for the help overlay (route-specific + globals). */
export function getHelpShortcuts(
  route: string,
  matchedPath?: string,
): Array<[string, string]> {
  const lookupRoute = matchedPath ? getShortcutRoute(matchedPath) : route;
  const base = getBaseRoute(lookupRoute);
  const seen = new Set<string>();
  const result: Array<[string, string]> = [];

  // Collect from exact route, then base route, then globals
  for (const scope of [lookupRoute, base, "_global"]) {
    const shortcuts = ROUTE_SHORTCUTS[scope];
    if (!shortcuts) continue;
    for (const def of Object.values(shortcuts)) {
      if (seen.has(def.key)) continue;
      // Skip display-only entries like "[ ]"
      if (def.key.includes(" ")) continue;
      seen.add(def.key);
      result.push([displayKey(def.key), def.help]);
    }
  }

  return result;
}

/** Match input against shortcuts for a route. Returns action name or null.
 *  Route-specific shortcuts take precedence over globals. */
export function matchShortcut(
  input: string,
  key: InkKey,
  route: string,
  matchedPath?: string,
): string | null {
  const lookupRoute = matchedPath ? getShortcutRoute(matchedPath) : route;
  // Route-specific shortcuts first
  const routeShortcuts = ROUTE_SHORTCUTS[lookupRoute];
  if (routeShortcuts) {
    for (const def of Object.values(routeShortcuts)) {
      if (matchKey(def.key, input, key)) return def.action;
    }
  }
  // Then globals
  const globals = ROUTE_SHORTCUTS._global;
  if (globals) {
    for (const def of Object.values(globals)) {
      if (matchKey(def.key, input, key)) return def.action;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function findShortcutByAction(
  action: string,
  route: string,
): ShortcutDef | undefined {
  const shortcuts = ROUTE_SHORTCUTS[route];
  if (!shortcuts) return undefined;
  return Object.values(shortcuts).find((s) => s.action === action);
}
