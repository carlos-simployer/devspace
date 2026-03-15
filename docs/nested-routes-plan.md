# Nested Routes + Outlet — Implementation Plan

## Status: Implemented

## Architecture

### Outlet Pattern (like React Router)
Parent layout renders shared state + `<Outlet />` slot where child routes appear.

```typescript
// routes.ts
jira: {
  component: JiraLayout,    // provides shared state via JiraContext
  children: {
    "": { component: JiraIssueListView },
    "detail/:key": { component: IssueDetail },
    "sort": { component: SortOverlay, layout: "overlay" },
    "statusFilter": { component: StatusFilter, layout: "overlay" },
    "memberSelect": { component: MemberSelect, layout: "overlay" },
    "help": { component: HelpOverlay, layout: "overlay" },
  },
}

// JiraLayout.tsx
function JiraLayout() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // ... shared state
  return (
    <JiraContext.Provider value={...}>
      <Outlet />
    </JiraContext.Provider>
  );
}
```

### Why JSX routes were rejected
- Harder to type-check
- Requires JSX tree walking to extract config
- React Router moved away from JSX-only in v6.4+
- Object definitions are simpler, more testable

### Key additions to router.ts
- `NestedRouteDef` type with `children`
- `defineRoutes` flattens nested defs internally
- `OutletContext` + `<Outlet />` component + `useOutlet()` hook
- `matchedPath` in RouterContext (pattern like "jira/detail/:key" for shortcut lookup)
- Fixes parameterized route shortcut bug

### Jira decomposition (proof of concept)
- JiraLayout: shared state (selectedIndex, filterMode, searchText, sortFields, etc.)
- JiraIssueListView: index route with list + status bar + search input handling
- Child components read from JiraContext instead of props
- Other views (PRs, Deps, etc.) remain flat — migrate later
