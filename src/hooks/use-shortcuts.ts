import { useInput } from "ink";
import { useView } from "../ui/view-context.ts";
import { matchShortcut, getTabNumberKeys, SHORTCUTS } from "../ui/index.ts";
import type { ViewId, BaseView } from "../ui/view-config.ts";

type ShortcutHandlers = Record<string, () => void>;

/**
 * Keyboard shortcut hook that replaces useInput in views.
 *
 * Reads the current view from ViewContext. Only fires handlers when
 * the current view matches the `scope` parameter.
 *
 * If `scope` is omitted, it defaults to the base view (e.g. "jira").
 * The hook only fires when:
 * - The current view === scope (exact match), OR
 * - The current view starts with scope + "." (sub-view of this scope)
 *   AND the matched action belongs to the current view or is global
 *
 * Global shortcuts (quit, help, tab switching) are handled automatically.
 *
 * @param scope - ViewId this hook is responsible for (e.g. "jira", "config")
 * @param handlers - Map of action name → callback
 * @param options.onUnhandled - Fallback for keys not matching any shortcut
 */
export function useShortcuts(
  handlers: ShortcutHandlers,
  options?: {
    scope?: ViewId;
    active?: boolean;
    onUnhandled?: (input: string, key: any) => void;
  },
) {
  const { view, setView, baseView } = useView();
  const scope = options?.scope ?? baseView;
  const enabled = options?.active ?? true;

  useInput((input, key) => {
    if (!enabled) return;
    // Only fire if current view is within our scope
    // e.g. scope="jira" fires for view="jira" but NOT for "jira.memberSelect"
    // scope="jira.detail" fires for view="jira.detail" only
    const isActive = view === scope;
    if (!isActive) {
      // Still handle global navigation (tab switching, quit) from any scope
      // within the same base view
      if (!view.startsWith(scope.split(".")[0]!)) return;

      const action = matchShortcut(input, key, view);
      if (action === "nextView") {
        handleViewSwitch(view, setView, false);
        return;
      }
      if (action === "prevView") {
        handleViewSwitch(view, setView, true);
        return;
      }
      if (action === "quit" && handlers.quit) {
        handlers.quit();
        return;
      }
      // Tab number keys
      const tabKeys = getTabNumberKeys();
      if (tabKeys[input]) {
        setView(tabKeys[input]!);
        return;
      }
      return;
    }

    const action = matchShortcut(input, key, view);

    if (action) {
      // Check if handler exists AND the action actually belongs to this view
      // (not a different sub-view that happens to share the action name)
      const shortcutDef = SHORTCUTS.find(
        (s) => s.action === action && (s.view === view || !s.view),
      );

      if (shortcutDef && handlers[action]) {
        handlers[action]();
        return;
      }

      // Built-in global handlers
      if (action === "nextView") {
        handleViewSwitch(view, setView, false);
        return;
      }
      if (action === "prevView") {
        handleViewSwitch(view, setView, true);
        return;
      }
      if (action === "help") {
        if (view.endsWith(".help")) {
          setView(view.replace(".help", "") as ViewId);
        } else {
          setView(`${view}.help` as ViewId);
        }
        return;
      }
    }

    // Esc closes help overlay from any .help view
    if (key.escape && view.endsWith(".help")) {
      setView(view.replace(".help", "") as ViewId);
      return;
    }

    // Tab number keys
    const tabKeys = getTabNumberKeys();
    if (tabKeys[input]) {
      setView(tabKeys[input]!);
      return;
    }

    // Fallback
    if (options?.onUnhandled) {
      options.onUnhandled(input, key);
    }
  });
}

const VIEW_ORDER: BaseView[] = [
  "prs",
  "dependencies",
  "pipelines",
  "releases",
  "projects",
  "jira",
  "config",
];

function handleViewSwitch(
  current: ViewId,
  setView: (v: ViewId) => void,
  reverse: boolean,
) {
  const base = current.split(".")[0] as BaseView;
  const idx = VIEW_ORDER.indexOf(base);
  const next = reverse
    ? (idx - 1 + VIEW_ORDER.length) % VIEW_ORDER.length
    : (idx + 1) % VIEW_ORDER.length;
  setView(VIEW_ORDER[next]!);
}
