import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect } from "vitest";
import {
  defineRoutes,
  RouterProvider,
  RouteRenderer,
  useRouter,
  Outlet,
  useOutlet,
  type RouteDef,
  type RouteInput,
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
  const { route, params, baseRoute, matchedPath } = useRouter();
  return (
    <Text>
      route={route} base={baseRoute} matchedPath={matchedPath} params=
      {JSON.stringify(params)}
    </Text>
  );
}

/** Helper: render a RouteRenderer inside a RouterProvider with given routes. */
function renderWithRouter(
  routeDefs: Record<string, RouteInput>,
  initialRoute: string,
) {
  const routes = defineRoutes(routeDefs);
  return render(
    <RouterProvider routes={routes} initialRoute={initialRoute}>
      <RouteRenderer routes={routes} />
    </RouterProvider>,
  );
}

/** Helper: render a RouteInspector inside a RouterProvider. */
function renderInspector(
  routeDefs: Record<string, RouteInput>,
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

  // --- Nested route flattening ---

  it("should flatten nested route definitions", () => {
    function ParentLayout() {
      return <Text>PARENT</Text>;
    }
    function ChildList() {
      return <Text>CHILD_LIST</Text>;
    }
    function ChildDetail() {
      return <Text>CHILD_DETAIL</Text>;
    }

    const routes = defineRoutes({
      jira: {
        component: ParentLayout,
        children: {
          "": { component: ChildList },
          "detail/:key": { component: ChildDetail, layout: "overlay" },
        },
      },
    });

    // Should have two flattened entries
    expect(routes.size).toBe(2);
    expect(routes.has("jira")).toBe(true);
    expect(routes.has("jira/detail/:key")).toBe(true);

    // Check flattened entry for index child
    const indexEntry = routes.get("jira")!;
    expect(indexEntry.parentComponent).toBe(ParentLayout);
    expect(indexEntry.childComponent).toBe(ChildList);

    // Check flattened entry for detail child
    const detailEntry = routes.get("jira/detail/:key")!;
    expect(detailEntry.parentComponent).toBe(ParentLayout);
    expect(detailEntry.childComponent).toBe(ChildDetail);
    expect(detailEntry.childLayout).toBe("overlay");
  });

  it("should mix flat and nested definitions", () => {
    function ParentLayout() {
      return <Text>PARENT</Text>;
    }
    function ChildIndex() {
      return <Text>CHILD</Text>;
    }

    const routes = defineRoutes({
      prs: { component: DummyComponent },
      "prs/detail": { component: DummyComponent },
      jira: {
        component: ParentLayout,
        children: {
          "": { component: ChildIndex },
        },
      },
    });

    expect(routes.size).toBe(3);
    expect(routes.has("prs")).toBe(true);
    expect(routes.has("prs/detail")).toBe(true);
    expect(routes.has("jira")).toBe(true);

    // Flat routes should not have parentComponent
    expect(routes.get("prs")!.parentComponent).toBeUndefined();
    // Nested route should have parentComponent
    expect(routes.get("jira")!.parentComponent).toBe(ParentLayout);
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
// RouterProvider context — route, baseRoute, params, matchedPath
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

  it("should provide matchedPath for exact routes", () => {
    const { lastFrame } = renderInspector(
      { prs: { component: DummyComponent } },
      "prs",
    );
    expect(lastFrame()).toContain("matchedPath=prs");
  });

  it("should provide matchedPath as the pattern for parameterized routes", () => {
    const { lastFrame } = renderInspector(
      { "jira/detail/:key": { component: DummyComponent } },
      "jira/detail/UUX-1629",
    );
    expect(lastFrame()).toContain("matchedPath=jira/detail/:key");
  });

  it("should provide matchedPath for nested routes", () => {
    function ParentLayout() {
      return (
        <>
          <RouteInspector />
          <Outlet />
        </>
      );
    }
    function ChildDetail() {
      return <Text>CHILD</Text>;
    }

    const routes = defineRoutes({
      jira: {
        component: ParentLayout,
        children: {
          "detail/:key": { component: ChildDetail },
        },
      },
    });

    const { lastFrame } = render(
      <RouterProvider routes={routes} initialRoute="jira/detail/UUX-1629">
        <RouteInspector />
      </RouterProvider>,
    );
    expect(lastFrame()).toContain("matchedPath=jira/detail/:key");
  });
});

// ===========================================================================
// Nested routes — Outlet and useOutlet
// ===========================================================================
describe("nested routes", () => {
  it("should render parent component with child via Outlet", () => {
    function ParentLayout() {
      return (
        <Text>
          PARENT:
          <Outlet />
        </Text>
      );
    }
    function ChildIndex() {
      return <Text>CHILD_INDEX</Text>;
    }

    const { lastFrame } = renderWithRouter(
      {
        jira: {
          component: ParentLayout,
          children: {
            "": { component: ChildIndex },
          },
        },
      },
      "jira",
    );

    expect(lastFrame()).toContain("PARENT");
    expect(lastFrame()).toContain("CHILD_INDEX");
  });

  it("should render correct child for parameterized nested route", () => {
    function ParentLayout() {
      return (
        <Text>
          LAYOUT:
          <Outlet />
        </Text>
      );
    }
    function ChildList() {
      return <Text>LIST_VIEW</Text>;
    }
    function ChildDetail() {
      return <Text>DETAIL_VIEW</Text>;
    }

    // Route to the detail child
    const { lastFrame } = renderWithRouter(
      {
        jira: {
          component: ParentLayout,
          children: {
            "": { component: ChildList },
            "detail/:key": { component: ChildDetail },
          },
        },
      },
      "jira/detail/UUX-42",
    );

    expect(lastFrame()).toContain("LAYOUT");
    expect(lastFrame()).toContain("DETAIL_VIEW");
    expect(lastFrame()).not.toContain("LIST_VIEW");
  });

  it("should render index child for base nested route", () => {
    function ParentLayout() {
      return (
        <Text>
          LAYOUT:
          <Outlet />
        </Text>
      );
    }
    function ChildList() {
      return <Text>LIST_VIEW</Text>;
    }
    function ChildDetail() {
      return <Text>DETAIL_VIEW</Text>;
    }

    const { lastFrame } = renderWithRouter(
      {
        jira: {
          component: ParentLayout,
          children: {
            "": { component: ChildList },
            "detail/:key": { component: ChildDetail },
          },
        },
      },
      "jira",
    );

    expect(lastFrame()).toContain("LAYOUT");
    expect(lastFrame()).toContain("LIST_VIEW");
    expect(lastFrame()).not.toContain("DETAIL_VIEW");
  });

  it("Outlet renders null when no context is provided", () => {
    // Outlet outside of a nested route renders nothing
    const { lastFrame } = render(<Outlet />);
    expect(lastFrame()).toBe("");
  });

  it("useOutlet returns null when no context is provided", () => {
    function OutletChecker() {
      const outlet = useOutlet();
      return <Text>outlet={outlet === null ? "null" : "present"}</Text>;
    }
    const { lastFrame } = render(<OutletChecker />);
    expect(lastFrame()).toContain("outlet=null");
  });

  it("useOutlet returns layout info inside a nested route", () => {
    function ParentLayout() {
      const outlet = useOutlet();
      return (
        <Text>
          layout={outlet?.layout} isOverlay=
          {String(outlet?.isOverlay)}
          <Outlet />
        </Text>
      );
    }
    function ChildView() {
      return <Text>CHILD</Text>;
    }

    const { lastFrame } = renderWithRouter(
      {
        jira: {
          component: ParentLayout,
          children: {
            "": { component: ChildView, layout: "overlay" },
          },
        },
      },
      "jira",
    );

    expect(lastFrame()).toContain("layout=overlay");
    expect(lastFrame()).toContain("isOverlay=true");
  });

  it("flat routes still render directly without Outlet (backward compat)", () => {
    const { lastFrame } = renderWithRouter(
      {
        prs: { component: () => <Text>FLAT_ROUTE</Text> },
      },
      "prs",
    );
    expect(lastFrame()).toContain("FLAT_ROUTE");
  });
});
