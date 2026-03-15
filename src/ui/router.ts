import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Box } from "ink";
import { getBaseRoute } from "./tabs.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteMatch {
  path: string; // defined route pattern, e.g. "jira/detail/:key"
  route: string; // actual current route, e.g. "jira/detail/UUX-1629"
  params: Record<string, string>;
  component: React.ComponentType<any>;
  layout: "full" | "overlay";
}

export interface RouterContextValue {
  route: string;
  params: Record<string, string>;
  baseRoute: string;
  navigate: (path: string) => void;
  goBack: () => void;
}

export interface RouteDef {
  component: React.ComponentType<any>;
  layout?: "full" | "overlay"; // default "full"
  bar?: string[]; // action names to show in shortcut bar (optional override)
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const RouterContext = createContext<RouterContextValue>({
  route: "prs",
  params: {},
  baseRoute: "prs",
  navigate: () => {},
  goBack: () => {},
});

export function useRouter(): RouterContextValue {
  return useContext(RouterContext);
}

// ---------------------------------------------------------------------------
// Route definition helper
// ---------------------------------------------------------------------------

export function defineRoutes(
  defs: Record<string, RouteDef>,
): Map<string, RouteDef> {
  return new Map(Object.entries(defs));
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

/**
 * Match a route string against a pattern with :param placeholders.
 * e.g. "jira/detail/:key" matches "jira/detail/UUX-1629"
 *       -> { key: "UUX-1629" }
 * Returns null if no match.
 */
function matchRoute(
  pattern: string,
  route: string,
): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const routeParts = route.split("/");

  if (patternParts.length !== routeParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const rp = routeParts[i]!;

    if (pp.startsWith(":")) {
      params[pp.slice(1)] = rp;
    } else if (pp !== rp) {
      return null;
    }
  }
  return params;
}

/**
 * Find the matching route definition for a given route string.
 * Tries exact match first, then pattern matching.
 */
function findMatch(
  routes: Map<string, RouteDef>,
  route: string,
): RouteMatch | null {
  // Exact match first
  const exact = routes.get(route);
  if (exact) {
    return {
      path: route,
      route,
      params: {},
      component: exact.component,
      layout: exact.layout ?? "full",
    };
  }

  // Pattern match
  for (const [pattern, def] of routes) {
    if (!pattern.includes(":")) continue;
    const params = matchRoute(pattern, route);
    if (params) {
      return {
        path: pattern,
        route,
        params,
        component: def.component,
        layout: def.layout ?? "full",
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// RouterProvider
// ---------------------------------------------------------------------------

interface RouterProviderProps {
  routes: Map<string, RouteDef>;
  initialRoute?: string;
  children: React.ReactNode;
}

export function RouterProvider({
  routes: _routes,
  initialRoute = "prs",
  children,
}: RouterProviderProps) {
  const [route, setRoute] = useState(initialRoute);
  const [_history, setHistory] = useState<string[]>([]);
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = useCallback(
    (path: string) => {
      setHistory((prev) => [...prev, route]);
      setRoute(path);
      // Extract params from the new route against all patterns
      // (will be recalculated in context value via match)
    },
    [route],
  );

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const previous = newHistory.pop()!;
      setRoute(previous);
      return newHistory;
    });
  }, []);

  const baseRoute = getBaseRoute(route);

  // Recalculate params when route changes by matching against route defs
  React.useEffect(() => {
    // We need access to routes to match params — but routes are in the
    // _routes prop. We match the current route against patterns.
    for (const [pattern] of _routes) {
      if (!pattern.includes(":")) continue;
      const matched = matchRoute(pattern, route);
      if (matched) {
        setParams(matched);
        return;
      }
    }
    setParams({});
  }, [route, _routes]);

  const value = useMemo(
    () => ({
      route,
      params,
      baseRoute,
      navigate,
      goBack,
    }),
    [route, params, baseRoute, navigate, goBack],
  );

  return React.createElement(RouterContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// RouteRenderer
// ---------------------------------------------------------------------------

interface RouteRendererProps {
  routes: Map<string, RouteDef>;
  height: number;
  width: number;
  [key: string]: any; // shared props passed to all route components
}

export function RouteRenderer({
  routes,
  height,
  width,
  ...sharedProps
}: RouteRendererProps) {
  const { route, params } = useRouter();

  const match = findMatch(routes, route);
  if (!match) return null;

  const componentProps = {
    ...sharedProps,
    ...params,
    height,
    width,
  };

  if (match.layout === "overlay") {
    return React.createElement(
      Box,
      {
        height,
        width,
        alignItems: "center",
        justifyContent: "center",
      },
      React.createElement(match.component, componentProps),
    );
  }

  // Full layout
  return React.createElement(match.component, componentProps);
}
