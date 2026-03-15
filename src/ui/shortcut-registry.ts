import type { ViewId } from "./view-config.ts";
import { VIEW_CONFIG, getBaseView } from "./view-config.ts";

export interface ShortcutDef {
  /** Action name, e.g. "open", "quit", "filterMine" */
  action: string;
  /** Key that triggers the action (character, or special: "tab", "return", "escape", "up", "down", "left", "right", "backspace", "delete") */
  key: string;
  /** View this shortcut is active in. undefined = global (always active). */
  view?: ViewId;
  /** Short label for the bottom bar (e.g. "Open"). Required if shown in bar. */
  label?: string;
  /** Description for the help overlay */
  help: string;
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
// The single source of truth for all shortcuts
// ---------------------------------------------------------------------------

export const SHORTCUTS: ShortcutDef[] = [
  // ── Global ──────────────────────────────────────────────────────────
  { action: "quit", key: "q", help: "Quit" },
  { action: "help", key: "?", help: "Toggle help" },
  { action: "nextView", key: "tab", help: "Next view" },
  { action: "prevView", key: "shift+tab", help: "Previous view" },
  // Tab number keys are derived from view-config.ts, not hardcoded here

  // ── PRs ─────────────────────────────────────────────────────────────
  {
    action: "open",
    key: "o",
    view: "prs",
    label: "Open",
    help: "Open PR in browser",
  },
  {
    action: "detail",
    key: "p",
    view: "prs",
    label: "Detail",
    help: "Open PR detail panel",
  },
  {
    action: "copyUrl",
    key: "y",
    view: "prs",
    label: "Copy",
    help: "Copy PR URL",
  },
  { action: "copyBranch", key: "Y", view: "prs", help: "Copy branch name" },
  {
    action: "sort",
    key: "S",
    view: "prs",
    label: "Sort",
    help: "Cycle sort mode",
  },
  {
    action: "notifications",
    key: "n",
    view: "prs",
    label: "Notif",
    help: "Toggle notifications",
  },
  {
    action: "filterMine",
    key: "m",
    view: "prs",
    label: "My PRs",
    help: "Filter: my PRs",
  },
  {
    action: "filterReview",
    key: "s",
    view: "prs",
    label: "To Review",
    help: "Filter: review requested",
  },
  {
    action: "filterAll",
    key: "t",
    view: "prs",
    label: "All",
    help: "Filter: all PRs",
  },
  {
    action: "filterClosed",
    key: "c",
    view: "prs",
    help: "Filter: closed/merged",
  },
  { action: "refresh", key: "R", view: "prs", help: "Force refresh" },
  { action: "add", key: "+", view: "prs", help: "Add repo" },
  { action: "search", key: "/", view: "prs", help: "Search/filter PRs" },
  { action: "remove", key: "d", view: "prs", help: "Remove selected repo" },
  { action: "openRepo", key: "r", view: "prs", help: "Open repo in browser" },
  { action: "openActions", key: "a", view: "prs", help: "Open Actions tab" },
  { action: "approve", key: "A", view: "prs", help: "Approve PR" },
  { action: "comment", key: "C", view: "prs", help: "Comment on PR" },
  { action: "requestChanges", key: "X", view: "prs", help: "Request changes" },
  { action: "up", key: "up", view: "prs", help: "Navigate up" },
  { action: "down", key: "down", view: "prs", help: "Navigate down" },
  { action: "left", key: "left", view: "prs", help: "Focus sidebar" },
  { action: "right", key: "right", view: "prs", help: "Focus list" },
  { action: "select", key: "return", view: "prs", help: "Select" },
  {
    action: "clearSearch",
    key: "escape",
    view: "prs",
    help: "Clear search / close",
  },

  // ── PR Detail ───────────────────────────────────────────────────────
  {
    action: "close",
    key: "escape",
    view: "prs.detail",
    label: "Close",
    help: "Close panel",
  },
  {
    action: "open",
    key: "o",
    view: "prs.detail",
    label: "Open",
    help: "Open in browser",
  },
  {
    action: "switchTab",
    key: "tab",
    view: "prs.detail",
    label: "Tab",
    help: "Switch tab",
  },
  { action: "filesTab", key: "f", view: "prs.detail", help: "Files tab" },
  { action: "overviewTab", key: "d", view: "prs.detail", help: "Overview tab" },
  { action: "up", key: "up", view: "prs.detail", help: "Scroll up" },
  { action: "down", key: "down", view: "prs.detail", help: "Scroll down" },
  {
    action: "select",
    key: "return",
    view: "prs.detail",
    help: "Expand/collapse file",
  },

  // ── PR Notifications ────────────────────────────────────────────────
  {
    action: "close",
    key: "escape",
    view: "prs.notifications",
    label: "Close",
    help: "Close",
  },
  {
    action: "open",
    key: "o",
    view: "prs.notifications",
    label: "Open",
    help: "Open in browser",
  },
  {
    action: "select",
    key: "return",
    view: "prs.notifications",
    help: "Open in browser",
  },
  { action: "up", key: "up", view: "prs.notifications", help: "Navigate up" },
  {
    action: "down",
    key: "down",
    view: "prs.notifications",
    help: "Navigate down",
  },

  // ── Dependencies ────────────────────────────────────────────────────
  {
    action: "add",
    key: "+",
    view: "dependencies",
    label: "Add",
    help: "Add package to track",
  },
  {
    action: "remove",
    key: "d",
    view: "dependencies",
    label: "Remove",
    help: "Remove package",
  },
  {
    action: "refresh",
    key: "R",
    view: "dependencies",
    label: "Refresh",
    help: "Force refresh",
  },
  {
    action: "open",
    key: "o",
    view: "dependencies",
    label: "Open",
    help: "Open in browser",
  },
  { action: "select", key: "return", view: "dependencies", help: "Select" },
  { action: "up", key: "up", view: "dependencies", help: "Navigate up" },
  { action: "down", key: "down", view: "dependencies", help: "Navigate down" },
  { action: "left", key: "left", view: "dependencies", help: "Focus packages" },
  {
    action: "right",
    key: "right",
    view: "dependencies",
    help: "Focus results",
  },

  // ── Pipelines ───────────────────────────────────────────────────────
  {
    action: "add",
    key: "+",
    view: "pipelines",
    label: "Add",
    help: "Add pipeline",
  },
  {
    action: "remove",
    key: "d",
    view: "pipelines",
    label: "Remove",
    help: "Remove pipeline",
  },
  {
    action: "runs",
    key: "p",
    view: "pipelines",
    label: "Runs",
    help: "View pipeline runs",
  },
  {
    action: "open",
    key: "o",
    view: "pipelines",
    label: "Open",
    help: "Open in browser",
  },
  {
    action: "refresh",
    key: "R",
    view: "pipelines",
    label: "Refresh",
    help: "Force refresh",
  },
  { action: "select", key: "return", view: "pipelines", help: "Select" },
  { action: "up", key: "up", view: "pipelines", help: "Navigate up" },
  { action: "down", key: "down", view: "pipelines", help: "Navigate down" },
  { action: "left", key: "left", view: "pipelines", help: "Focus sidebar" },
  { action: "right", key: "right", view: "pipelines", help: "Focus list" },

  // ── Pipeline Runs ───────────────────────────────────────────────────
  {
    action: "close",
    key: "escape",
    view: "pipelines.runs",
    label: "Close",
    help: "Close runs",
  },
  {
    action: "open",
    key: "o",
    view: "pipelines.runs",
    label: "Open",
    help: "Open in browser",
  },
  { action: "up", key: "up", view: "pipelines.runs", help: "Navigate up" },
  {
    action: "down",
    key: "down",
    view: "pipelines.runs",
    help: "Navigate down",
  },

  // ── Releases ────────────────────────────────────────────────────────
  {
    action: "add",
    key: "+",
    view: "releases",
    label: "Add",
    help: "Add release definition",
  },
  {
    action: "remove",
    key: "d",
    view: "releases",
    label: "Remove",
    help: "Remove definition",
  },
  {
    action: "open",
    key: "o",
    view: "releases",
    label: "Open",
    help: "Open in browser",
  },
  {
    action: "refresh",
    key: "R",
    view: "releases",
    label: "Refresh",
    help: "Refresh",
  },
  { action: "select", key: "return", view: "releases", help: "Select" },
  { action: "up", key: "up", view: "releases", help: "Navigate up" },
  { action: "down", key: "down", view: "releases", help: "Navigate down" },
  { action: "left", key: "left", view: "releases", help: "Focus sidebar" },
  { action: "right", key: "right", view: "releases", help: "Focus list" },

  // ── Projects ────────────────────────────────────────────────────────
  {
    action: "start",
    key: "s",
    view: "projects",
    label: "Start",
    help: "Start project (with deps)",
  },
  {
    action: "kill",
    key: "K",
    view: "projects",
    label: "Kill",
    help: "Kill project",
  },
  {
    action: "restart",
    key: "R",
    view: "projects",
    label: "Restart",
    help: "Restart project",
  },
  {
    action: "open",
    key: "o",
    view: "projects",
    label: "Open",
    help: "Open URL in browser",
  },
  {
    action: "add",
    key: "+",
    view: "projects",
    label: "Add",
    help: "Add project",
  },
  {
    action: "remove",
    key: "d",
    view: "projects",
    label: "Remove",
    help: "Remove project",
  },
  {
    action: "scrollLogs",
    key: "[ ]",
    view: "projects",
    label: "Scroll Logs",
    help: "Scroll logs",
  },
  {
    action: "startAll",
    key: "S",
    view: "projects",
    label: "Start All",
    help: "Start all projects",
  },
  {
    action: "scrollDown",
    key: "]",
    view: "projects",
    help: "Scroll logs down",
  },
  { action: "scrollUp", key: "[", view: "projects", help: "Scroll logs up" },
  { action: "pageDown", key: "}", view: "projects", help: "Page down logs" },
  { action: "pageUp", key: "{", view: "projects", help: "Page up logs" },
  { action: "logTop", key: "g", view: "projects", help: "Logs: jump to top" },
  {
    action: "logBottom",
    key: "G",
    view: "projects",
    help: "Logs: jump to bottom",
  },
  { action: "clearLogs", key: "c", view: "projects", help: "Clear logs" },
  { action: "up", key: "up", view: "projects", help: "Navigate up" },
  { action: "down", key: "down", view: "projects", help: "Navigate down" },

  // ── Jira ────────────────────────────────────────────────────────────
  {
    action: "open",
    key: "o",
    view: "jira",
    label: "Open",
    help: "Open issue in browser",
  },
  { action: "detail", key: "return", view: "jira", help: "Open issue detail" },
  {
    action: "filterMine",
    key: "m",
    view: "jira",
    label: "Mine",
    help: "Filter: my issues",
  },
  {
    action: "filterTeam",
    key: "t",
    view: "jira",
    label: "Team",
    help: "Filter: all team",
  },
  {
    action: "filterPerson",
    key: "u",
    view: "jira",
    label: "User",
    help: "Filter: select person",
  },
  { action: "search", key: "/", view: "jira", help: "Search/filter issues" },
  {
    action: "refresh",
    key: "R",
    view: "jira",
    label: "Refresh",
    help: "Force refresh",
  },
  {
    action: "filterStatus",
    key: "f",
    view: "jira",
    label: "Status",
    help: "Filter by status",
  },
  { action: "up", key: "up", view: "jira", help: "Navigate up" },
  { action: "down", key: "down", view: "jira", help: "Navigate down" },
  {
    action: "clearSearch",
    key: "escape",
    view: "jira",
    help: "Clear search / close",
  },

  // ── Jira Status Filter ──────────────────────────────────────────────
  { action: "close", key: "escape", view: "jira.statusFilter", help: "Close" },
  {
    action: "select",
    key: "return",
    view: "jira.statusFilter",
    help: "Toggle all",
  },
  {
    action: "toggle",
    key: " ",
    view: "jira.statusFilter",
    help: "Toggle status",
  },
  { action: "up", key: "up", view: "jira.statusFilter", help: "Navigate up" },
  {
    action: "down",
    key: "down",
    view: "jira.statusFilter",
    help: "Navigate down",
  },

  // ── Jira Detail ─────────────────────────────────────────────────────
  {
    action: "close",
    key: "escape",
    view: "jira.detail",
    label: "Close",
    help: "Close detail",
  },
  {
    action: "open",
    key: "o",
    view: "jira.detail",
    label: "Open",
    help: "Open in browser",
  },
  { action: "overviewTab", key: "d", view: "jira.detail", help: "Details tab" },
  {
    action: "commentsTab",
    key: "c",
    view: "jira.detail",
    help: "Comments tab",
  },
  {
    action: "subtasksTab",
    key: "s",
    view: "jira.detail",
    help: "Subtasks tab",
  },
  { action: "up", key: "up", view: "jira.detail", help: "Scroll up" },
  { action: "down", key: "down", view: "jira.detail", help: "Scroll down" },

  // ── Jira Member Select ──────────────────────────────────────────────
  { action: "close", key: "escape", view: "jira.memberSelect", help: "Cancel" },
  {
    action: "select",
    key: "return",
    view: "jira.memberSelect",
    help: "Select member",
  },
  { action: "up", key: "up", view: "jira.memberSelect", help: "Navigate up" },
  {
    action: "down",
    key: "down",
    view: "jira.memberSelect",
    help: "Navigate down",
  },

  // ── Config ──────────────────────────────────────────────────────────
  {
    action: "add",
    key: "+",
    view: "config",
    label: "Add",
    help: "Add organization",
  },
  {
    action: "remove",
    key: "d",
    view: "config",
    label: "Remove",
    help: "Remove organization",
  },
  {
    action: "select",
    key: "return",
    view: "config",
    label: "Select",
    help: "Select / edit",
  },
  {
    action: "editConfig",
    key: "e",
    view: "config",
    label: "Edit",
    help: "Open config in VS Code",
  },
  { action: "up", key: "up", view: "config", help: "Navigate up" },
  { action: "down", key: "down", view: "config", help: "Navigate down" },
  { action: "left", key: "left", view: "config", help: "Previous section" },
  { action: "right", key: "right", view: "config", help: "Next section" },
];

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

function displayKey(key: string): string {
  return KEY_DISPLAY[key] ?? key;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Get shortcuts for the bottom bar of a view. Uses the bar list from VIEW_CONFIG. */
export function getBarShortcuts(
  viewId: ViewId,
): Array<{ key: string; label: string }> {
  const config = VIEW_CONFIG[viewId] ?? VIEW_CONFIG[getBaseView(viewId)];
  if (!config) return [];

  const actionNames = config.bar;
  const result: Array<{ key: string; label: string }> = [];
  for (const actionName of actionNames) {
    const def = SHORTCUTS.find(
      (s) =>
        s.action === actionName &&
        (s.view === viewId || s.view === getBaseView(viewId) || !s.view),
    );
    if (def?.label) {
      result.push({ key: displayKey(def.key), label: def.label });
    }
  }
  return result;
}

/** Get shortcuts for the help overlay (view-specific + globals). */
export function getHelpShortcuts(viewId: ViewId): Array<[string, string]> {
  const base = getBaseView(viewId);
  return SHORTCUTS.filter(
    (s) => s.view === viewId || s.view === base || !s.view,
  )
    .filter((s) => !s.key.includes(" ")) // skip display-only entries like "[ ]"
    .map((s) => [displayKey(s.key), s.help]);
}

/** Get active shortcuts for a view (for input matching). View-specific first, then globals. */
export function getActiveShortcuts(viewId: ViewId): ShortcutDef[] {
  return SHORTCUTS.filter((s) => s.view === viewId || !s.view);
}

/** Match input against shortcuts for a view. Returns action name or null. */
export function matchShortcut(
  input: string,
  key: InkKey,
  viewId: ViewId,
): string | null {
  // View-specific shortcuts take precedence over globals
  const viewShortcuts = SHORTCUTS.filter((s) => s.view === viewId);
  for (const s of viewShortcuts) {
    if (matchKey(s.key, input, key)) return s.action;
  }
  const globalShortcuts = SHORTCUTS.filter((s) => !s.view);
  for (const s of globalShortcuts) {
    if (matchKey(s.key, input, key)) return s.action;
  }
  return null;
}
