import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  matchedPath: string;
  navigate: (path: string) => void;
  goBack: () => void;
}

export interface RouteDef {
  component: React.ComponentType<any>;
  layout?: "full" | "overlay"; // default "full"
  bar?: string[]; // action names to show in shortcut bar (optional override)
}

export interface ChildRouteDef {
  component: React.ComponentType<any>;
  layout?: "full" | "overlay";
}

export interface NestedRouteDef {
  component: React.ComponentType<any>; // layout/parent component
  children: Record<string, ChildRouteDef>;
}

export type RouteInput = RouteDef | NestedRouteDef;

// Flattened type used by RouterProvider and RouteRenderer
export interface FlattenedRouteDef {
  component: React.ComponentType<any>;
  layout?: "full" | "overlay";
  parentComponent?: React.ComponentType<any>;
  childComponent?: React.ComponentType<any>;
  childLayout?: "full" | "overlay";
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const RouterContext = createContext<RouterContextValue>({
  route: "prs",
  params: {},
  baseRoute: "prs",
  matchedPath: "prs",
  navigate: () => {},
  goBack: () => {},
});

export function useRouter(): RouterContextValue {
  return useContext(RouterContext);
}

// ---------------------------------------------------------------------------
// Outlet — renders the child component in a nested route layout
// ---------------------------------------------------------------------------

interface OutletContextValue {
  component: React.ComponentType<any>;
  layout: "full" | "overlay";
}

const OutletContext = createContext<OutletContextValue | null>(null);

export function Outlet() {
  const ctx = useContext(OutletContext);
  if (!ctx) return null;
  return React.createElement(ctx.component);
}

export function useOutlet() {
  const ctx = useContext(OutletContext);
  if (!ctx) return null;
  return { layout: ctx.layout, isOverlay: ctx.layout === "overlay" };
}

// ---------------------------------------------------------------------------
// Route definition helper
// ---------------------------------------------------------------------------

/** Type guard: detect nested route definitions (have `children` property). */
function isNestedDef(def: RouteInput): def is NestedRouteDef {
  return "children" in def && typeof def.children === "object";
}

export function defineRoutes(
  defs: Record<string, RouteInput>,
): Map<string, FlattenedRouteDef> {
  const result = new Map<string, FlattenedRouteDef>();

  for (const [key, def] of Object.entries(defs)) {
    if (isNestedDef(def)) {
      // Flatten nested routes: parent + children
      for (const [childPath, childDef] of Object.entries(def.children)) {
        const flatKey = childPath === "" ? key : `${key}/${childPath}`;
        result.set(flatKey, {
          component: def.component,
          layout: childDef.layout,
          parentComponent: def.component,
          childComponent: childDef.component,
          childLayout: childDef.layout,
        });
      }
    } else {
      // Flat route — pass through unchanged (backward compatible)
      result.set(key, {
        component: def.component,
        layout: def.layout,
      });
    }
  }

  return result;
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

/** Extended match that includes nesting info from FlattenedRouteDef. */
interface FlattenedMatch extends RouteMatch {
  parentComponent?: React.ComponentType<any>;
  childComponent?: React.ComponentType<any>;
  childLayout?: "full" | "overlay";
}

/**
 * Find the matching route definition for a given route string.
 * Tries exact match first, then pattern matching.
 */
function findMatch(
  routes: Map<string, FlattenedRouteDef>,
  route: string,
): FlattenedMatch | null {
  // Exact match first
  const exact = routes.get(route);
  if (exact) {
    return {
      path: route,
      route,
      params: {},
      component: exact.component,
      layout: exact.layout ?? "full",
      parentComponent: exact.parentComponent,
      childComponent: exact.childComponent,
      childLayout: exact.childLayout,
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
        parentComponent: def.parentComponent,
        childComponent: def.childComponent,
        childLayout: def.childLayout,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// RouterProvider
// ---------------------------------------------------------------------------

interface RouterProviderProps {
  routes: Map<string, FlattenedRouteDef>;
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

  // Use a ref so navigate always reads the current route without a dep
  const routeRef = useRef(initialRoute);
  routeRef.current = route;

  const navigate = useCallback((path: string) => {
    setHistory((prev) => {
      const capped = prev.length >= 50 ? prev.slice(-49) : prev;
      return [...capped, routeRef.current];
    });
    setRoute(path);
  }, []); // stable — no deps

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

  // Derive params + matchedPath synchronously — no useEffect / useState needed
  const value = useMemo(() => {
    let params: Record<string, string> = {};
    let matchedPath: string = route;

    // Try exact match first
    if (_routes.has(route)) {
      params = {};
      matchedPath = route;
    } else {
      // Pattern match
      for (const [pattern] of _routes) {
        if (!pattern.includes(":")) continue;
        const matched = matchRoute(pattern, route);
        if (matched) {
          params = matched;
          matchedPath = pattern;
          break;
        }
      }
    }

    return { route, params, baseRoute, matchedPath, navigate, goBack };
  }, [route, _routes, baseRoute, navigate, goBack]);

  return React.createElement(RouterContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// RouteRenderer
// ---------------------------------------------------------------------------

interface RouteRendererProps {
  routes: Map<string, FlattenedRouteDef>;
}

/**
 * Renders the matched route component with no props.
 * For nested routes, wraps the child in OutletContext and renders the parent.
 * Views read shared data from AppContext via useAppContext().
 */
export function RouteRenderer({ routes }: RouteRendererProps) {
  const { route } = useRouter();

  const match = findMatch(routes, route);
  if (!match) return null;

  // Nested route: parent renders <Outlet /> which picks up the child
  if (match.parentComponent && match.childComponent) {
    const outletValue: OutletContextValue = {
      component: match.childComponent,
      layout: match.childLayout ?? "full",
    };
    return React.createElement(
      OutletContext.Provider,
      { value: outletValue },
      React.createElement(match.parentComponent),
    );
  }

  // Flat route — render component directly (backward compatible)
  return React.createElement(match.component);
}
