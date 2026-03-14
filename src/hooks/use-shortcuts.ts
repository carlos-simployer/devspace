import { useInput } from "ink";
import { useView } from "../ui/view-context.ts";
import { matchShortcut, getTabNumberKeys } from "../ui/index.ts";
import type { ViewId, BaseView } from "../ui/view-config.ts";

type ShortcutHandlers = Record<string, () => void>;

/**
 * Keyboard shortcut hook that replaces useInput in views.
 *
 * Reads the current view from ViewContext. Only fires handlers for
 * shortcuts matching the active view or global shortcuts.
 *
 * Global shortcuts (quit, help, tab switching) are handled automatically
 * unless overridden by a view-specific handler.
 *
 * @param handlers - Map of action name → callback
 * @param options.onUnhandled - Fallback for keys not matching any shortcut
 */
export function useShortcuts(
  handlers: ShortcutHandlers,
  options?: {
    onUnhandled?: (input: string, key: any) => void;
  },
) {
  const { view, setView } = useView();

  useInput((input, key) => {
    const action = matchShortcut(input, key, view);

    if (action) {
      // View-provided handler takes priority
      if (handlers[action]) {
        handlers[action]();
        return;
      }

      // Built-in global handlers
      if (action === "quit" && handlers.quit) {
        handlers.quit();
        return;
      }
      if (action === "nextView") {
        handleViewSwitch(view, setView, false);
        return;
      }
      if (action === "prevView") {
        handleViewSwitch(view, setView, true);
        return;
      }
      if (action === "help") {
        // Toggle help: if already in help, go back; else go to help
        if (view.endsWith(".help")) {
          setView(view.replace(".help", "") as ViewId);
        } else {
          setView(`${view}.help` as ViewId);
        }
        return;
      }
    }

    // Tab number keys (1-6)
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
