import { useInput } from "ink";
import { useRouter } from "../ui/router.ts";
import { matchShortcut, ROUTE_SHORTCUTS } from "../ui/route-shortcuts.ts";
import { getBaseRoute, getTabNumberKeys, TABS } from "../ui/tabs.ts";

type ShortcutHandlers = Record<string, () => void>;

/**
 * Keyboard shortcut hook that replaces useShortcuts for the new router system.
 *
 * Reads the current route from RouterContext. Only fires handlers when
 * the current route matches the hook's scope (auto-derived from current route).
 *
 * Global shortcuts (quit, help, tab switching) are handled automatically.
 *
 * @param handlers - Map of action name -> callback
 * @param options.active - Set to false to disable during text input modes
 * @param options.onUnhandled - Fallback for keys not matching any shortcut
 */
export function useRouteShortcuts(
  handlers: ShortcutHandlers,
  options?: {
    active?: boolean;
    onUnhandled?: (input: string, key: any) => void;
  },
) {
  const { route, navigate, baseRoute: _baseRoute } = useRouter();
  const enabled = options?.active ?? true;

  useInput((input, key) => {
    if (!enabled) return;

    // ── Help overlay handling ──────────────────────────────────────────
    // When on a help route (ends with /help), ? and Esc close it
    if (route.endsWith("/help")) {
      if (input === "?" || key.escape) {
        navigate(route.replace(/\/help$/, ""));
        return;
      }
      // While on help, still allow tab switching and quit
      const action = matchShortcut(input, key, route);
      if (action === "nextView") {
        handleViewSwitch(route, navigate, false);
        return;
      }
      if (action === "prevView") {
        handleViewSwitch(route, navigate, true);
        return;
      }
      if (action === "quit" && handlers.quit) {
        handlers.quit();
        return;
      }
      // Tab number keys
      const tabKeys = getTabNumberKeys();
      if (tabKeys[input]) {
        navigate(tabKeys[input]!);
        return;
      }
      return;
    }

    // ── Match shortcuts for the current route ──────────────────────────
    const action = matchShortcut(input, key, route);

    if (action) {
      // Check if handler exists AND the action belongs to this route or is global
      const routeShortcuts = ROUTE_SHORTCUTS[route];
      const globalShortcuts = ROUTE_SHORTCUTS._global;
      const isRouteAction = routeShortcuts
        ? Object.values(routeShortcuts).some((s) => s.action === action)
        : false;
      const isGlobalAction = globalShortcuts
        ? Object.values(globalShortcuts).some((s) => s.action === action)
        : false;

      // Fire handler if the action belongs to the current route
      if (isRouteAction && handlers[action]) {
        handlers[action]();
        return;
      }

      // Built-in global handlers
      if (isGlobalAction || isRouteAction) {
        if (action === "nextView") {
          handleViewSwitch(route, navigate, false);
          return;
        }
        if (action === "prevView") {
          handleViewSwitch(route, navigate, true);
          return;
        }
        if (action === "help") {
          navigate(`${route}/help`);
          return;
        }
        if (action === "quit" && handlers.quit) {
          handlers.quit();
          return;
        }
      }
    }

    // ── Tab number keys ────────────────────────────────────────────────
    const tabKeys = getTabNumberKeys();
    if (tabKeys[input]) {
      navigate(tabKeys[input]!);
      return;
    }

    // ── Fallback ───────────────────────────────────────────────────────
    if (options?.onUnhandled) {
      options.onUnhandled(input, key);
    }
  });
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

const ROUTE_ORDER = TABS.map((t) => t.route);

function handleViewSwitch(
  current: string,
  navigate: (path: string) => void,
  reverse: boolean,
) {
  const base = getBaseRoute(current);
  const idx = ROUTE_ORDER.indexOf(base);
  if (idx < 0) return;
  const next = reverse
    ? (idx - 1 + ROUTE_ORDER.length) % ROUTE_ORDER.length
    : (idx + 1) % ROUTE_ORDER.length;
  navigate(ROUTE_ORDER[next]!);
}
