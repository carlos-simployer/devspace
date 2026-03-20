import { useInput } from "ink";
import { useRouter } from "../ui/router.ts";
import { useFocus } from "../ui/focus.ts";
import {
  matchShortcut,
  ROUTE_SHORTCUTS,
  getShortcutRoute,
} from "../ui/route-shortcuts.ts";
import { getBaseRoute, getTabNumberKeys, getTabs } from "../ui/tabs.ts";

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
 * @param options.focusHandlers - Per-focus-node handlers; dispatched when a
 *   FocusProvider is in the tree and the focused node has a handler for the action.
 *   When provided, left/right arrow keys auto-wire to focusPrev/focusNext unless
 *   a handler is explicitly defined for those actions.
 */
export function useRouteShortcuts(
  handlers: ShortcutHandlers,
  options?: {
    active?: boolean;
    onUnhandled?: (input: string, key: any) => void;
    focusHandlers?: Record<string, ShortcutHandlers>;
  },
) {
  const { route, navigate, baseRoute: _baseRoute, matchedPath } = useRouter();
  const { focusedId, focusNext, focusPrev } = useFocus();
  const enabled = options?.active ?? true;
  const focusHandlers = options?.focusHandlers;

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
      const action = matchShortcut(input, key, route, matchedPath);
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

    // ── Log overlay handling ────────────────────────────────────────────
    // When on a logs route (ends with /logs), L and Esc close it
    if (route.endsWith("/logs")) {
      if (input === "L" || key.escape) {
        navigate(route.replace(/\/logs$/, ""));
        return;
      }
      // Fire route-specific handlers (scroll, clear)
      const action = matchShortcut(input, key, route, matchedPath);
      if (action && handlers[action]) {
        handlers[action]();
        return;
      }
      // While on logs, still allow tab switching and quit
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
      const tabKeys = getTabNumberKeys();
      if (tabKeys[input]) {
        navigate(tabKeys[input]!);
        return;
      }
      return;
    }

    // ── Match shortcuts for the current route ──────────────────────────
    const action = matchShortcut(input, key, route, matchedPath);

    if (action) {
      // Check if handler exists AND the action belongs to this route or is global
      const shortcutKey = getShortcutRoute(matchedPath);
      const routeShortcuts = ROUTE_SHORTCUTS[shortcutKey];
      const globalShortcuts = ROUTE_SHORTCUTS._global;
      const isRouteAction = routeShortcuts
        ? Object.values(routeShortcuts).some((s) => s.action === action)
        : false;
      const isGlobalAction = globalShortcuts
        ? Object.values(globalShortcuts).some((s) => s.action === action)
        : false;

      // Fire handler if the action belongs to the current route
      if (isRouteAction) {
        // Try focus-specific handler first
        if (focusHandlers && focusedId) {
          const focusHandler = focusHandlers[focusedId]?.[action];
          if (focusHandler) {
            focusHandler();
            return;
          }
        }

        // Auto-wire left/right to focus cycling when focusHandlers is provided
        if (focusHandlers && focusedId) {
          if (action === "left") {
            focusPrev();
            return;
          }
          if (action === "right") {
            focusNext();
            return;
          }
        }

        if (handlers[action]) {
          handlers[action]();
          return;
        }
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
          if (route.endsWith("/help")) {
            navigate(route.replace(/\/help$/, ""));
          } else {
            navigate(`${getBaseRoute(route)}/help`);
          }
          return;
        }
        if (action === "logs") {
          if (route.endsWith("/logs")) {
            navigate(route.replace(/\/logs$/, ""));
          } else {
            navigate(`${getBaseRoute(route)}/logs`);
          }
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

function handleViewSwitch(
  current: string,
  navigate: (path: string) => void,
  reverse: boolean,
) {
  const routes = getTabs().map((t) => t.route);
  const base = getBaseRoute(current);
  const idx = routes.indexOf(base);
  if (idx < 0) return;
  const next = reverse
    ? (idx - 1 + routes.length) % routes.length
    : (idx + 1) % routes.length;
  navigate(routes[next]!);
}
