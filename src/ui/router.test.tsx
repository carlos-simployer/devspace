import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect } from "vitest";
import {
  defineRoutes,
  RouterProvider,
  RouteRenderer,
  useRouter,
  type RouteDef,
} from "./router.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dummy component that renders its route params as text for assertion. */
function DummyComponent(props: Record<string, unknown>) {
  return <Text>MATCHED:{JSON.stringify(props)}</Text>;
}

/** Component that displays the current route context for inspection. */
function RouteInspector() {
  const { route, params, baseRoute } = useRouter();
  return (
    <Text>
      route={route} base={baseRoute} params={JSON.stringify(params)}
    </Text>
  );
}

/** Helper: render a RouteRenderer inside a RouterProvider with given routes. */
function renderWithRouter(
  routeDefs: Record<string, RouteDef>,
  initialRoute: string,
) {
  const routes = defineRoutes(routeDefs);
  return render(
    <RouterProvider routes={routes} initialRoute={initialRoute}>
      <RouteRenderer routes={routes} height={24} width={80} />
    </RouterProvider>,
  );
}

/** Helper: render a RouteInspector inside a RouterProvider. */
function renderInspector(
  routeDefs: Record<string, RouteDef>,
  initialRoute: string,
) {
  const routes = defineRoutes(routeDefs);
  return render(
    <RouterProvider routes={routes} initialRoute={initialRoute}>
      <RouteInspector />
    </RouterProvider>,
  );
}

// ===========================================================================
// defineRoutes
// ===========================================================================
describe("defineRoutes", () => {
  it("should return a Map from route definition objects", () => {
    const routes = defineRoutes({
      prs: { component: DummyComponent },
      config: { component: DummyComponent },
    });
    expect(routes).toBeInstanceOf(Map);
    expect(routes.size).toBe(2);
  });

  it("should preserve all route keys", () => {
    const routes = defineRoutes({
      prs: { component: DummyComponent },
      "prs/detail": { component: DummyComponent },
      "jira/detail/:key": { component: DummyComponent },
    });
    expect(routes.has("prs")).toBe(true);
    expect(routes.has("prs/detail")).toBe(true);
    expect(routes.has("jira/detail/:key")).toBe(true);
  });

  it("should preserve component references", () => {
    const routes = defineRoutes({
      prs: { component: DummyComponent },
    });
    expect(routes.get("prs")?.component).toBe(DummyComponent);
  });

  it("should preserve layout configuration", () => {
    const routes = defineRoutes({
      prs: { component: DummyComponent, layout: "full" },
      "prs/help": { component: DummyComponent, layout: "overlay" },
    });
    expect(routes.get("prs")?.layout).toBe("full");
    expect(routes.get("prs/help")?.layout).toBe("overlay");
  });

  it("should handle an empty definition object", () => {
    const routes = defineRoutes({});
    expect(routes).toBeInstanceOf(Map);
    expect(routes.size).toBe(0);
  });

  it("should handle a single route", () => {
    const routes = defineRoutes({
      prs: { component: DummyComponent },
    });
    expect(routes.size).toBe(1);
    expect(routes.has("prs")).toBe(true);
  });
});

// ===========================================================================
// Route matching — exact matches (tested via RouteRenderer)
// ===========================================================================
describe("route matching (exact)", () => {
  it("should match an exact route and render its component", () => {
    const { lastFrame } = renderWithRouter(
      {
        prs: { component: () => <Text>PRS_VIEW</Text> },
      },
      "prs",
    );
    expect(lastFrame()).toContain("PRS_VIEW");
  });

  it("should match an exact sub-route", () => {
    const { lastFrame } = renderWithRouter(
      {
        prs: { component: () => <Text>PRS_VIEW</Text> },
        "prs/detail": { component: () => <Text>PRS_DETAIL</Text> },
      },
      "prs/detail",
    );
    expect(lastFrame()).toContain("PRS_DETAIL");
    expect(lastFrame()).not.toContain("PRS_VIEW");
  });

  it("should return nothing when no route matches", () => {
    const { lastFrame } = renderWithRouter(
      {
        prs: { component: () => <Text>PRS_VIEW</Text> },
      },
      "nonexistent",
    );
    // RouteRenderer returns null when no match
    expect(lastFrame()).not.toContain("PRS_VIEW");
  });
});

// ===========================================================================
// Route matching — parameterized routes (tested via RouteRenderer)
// ===========================================================================
describe("route matching (params)", () => {
  it("should match a route with a single :param placeholder", () => {
    const { lastFrame } = renderWithRouter(
      {
        "jira/detail/:key": {
          component: (props: { key?: string }) => <Text>JIRA_DETAIL</Text>,
        },
      },
      "jira/detail/UUX-1629",
    );
    expect(lastFrame()).toContain("JIRA_DETAIL");
  });

  it("should not match when segment count differs", () => {
    const { lastFrame } = renderWithRouter(
      {
        "jira/detail/:key": {
          component: () => <Text>JIRA_DETAIL</Text>,
        },
      },
      "jira/detail",
    );
    expect(lastFrame()).not.toContain("JIRA_DETAIL");
  });

  it("should not match when segment count has extra segments", () => {
    const { lastFrame } = renderWithRouter(
      {
        "jira/detail/:key": {
          component: () => <Text>JIRA_DETAIL</Text>,
        },
      },
      "jira/detail/UUX-1629/extra",
    );
    expect(lastFrame()).not.toContain("JIRA_DETAIL");
  });

  it("should not match when static segments differ", () => {
    const { lastFrame } = renderWithRouter(
      {
        "jira/detail/:key": {
          component: () => <Text>JIRA_DETAIL</Text>,
        },
      },
      "jira/overview/UUX-1629",
    );
    expect(lastFrame()).not.toContain("JIRA_DETAIL");
  });

  it("should prefer exact match over parameterized match", () => {
    const { lastFrame } = renderWithRouter(
      {
        "jira/detail": {
          component: () => <Text>EXACT_MATCH</Text>,
        },
        "jira/:section": {
          component: () => <Text>PARAM_MATCH</Text>,
        },
      },
      "jira/detail",
    );
    expect(lastFrame()).toContain("EXACT_MATCH");
    expect(lastFrame()).not.toContain("PARAM_MATCH");
  });

  it("should match parameterized route when no exact match exists", () => {
    const { lastFrame } = renderWithRouter(
      {
        "jira/detail": {
          component: () => <Text>EXACT_MATCH</Text>,
        },
        "jira/:section": {
          component: () => <Text>PARAM_MATCH</Text>,
        },
      },
      "jira/settings",
    );
    expect(lastFrame()).toContain("PARAM_MATCH");
    expect(lastFrame()).not.toContain("EXACT_MATCH");
  });

  it("should match route with multiple param segments", () => {
    const { lastFrame } = renderWithRouter(
      {
        ":view/:action/:id": {
          component: () => <Text>MULTI_PARAM</Text>,
        },
      },
      "jira/detail/UUX-42",
    );
    expect(lastFrame()).toContain("MULTI_PARAM");
  });

  it("should default layout to full when not specified", () => {
    const { lastFrame } = renderWithRouter(
      {
        prs: { component: () => <Text>FULL_LAYOUT</Text> },
      },
      "prs",
    );
    expect(lastFrame()).toContain("FULL_LAYOUT");
  });
});

// ===========================================================================
// RouterProvider context — route, baseRoute, params
// ===========================================================================
describe("RouterProvider context", () => {
  it("should provide the current route", () => {
    const { lastFrame } = renderInspector(
      { prs: { component: DummyComponent } },
      "prs",
    );
    expect(lastFrame()).toContain("route=prs");
  });

  it("should provide the base route for sub-routes", () => {
    const { lastFrame } = renderInspector(
      { "prs/detail": { component: DummyComponent } },
      "prs/detail",
    );
    expect(lastFrame()).toContain("route=prs/detail");
    expect(lastFrame()).toContain("base=prs");
  });

  it("should provide the base route for deeply nested routes", () => {
    const { lastFrame } = renderInspector(
      { "jira/detail/:key": { component: DummyComponent } },
      "jira/detail/UUX-1629",
    );
    expect(lastFrame()).toContain("route=jira/detail/UUX-1629");
    expect(lastFrame()).toContain("base=jira");
  });

  it("should default to prs route when no initialRoute is provided", () => {
    const routes = defineRoutes({ prs: { component: DummyComponent } });
    const { lastFrame } = render(
      <RouterProvider routes={routes}>
        <RouteInspector />
      </RouterProvider>,
    );
    expect(lastFrame()).toContain("route=prs");
    expect(lastFrame()).toContain("base=prs");
  });
});
