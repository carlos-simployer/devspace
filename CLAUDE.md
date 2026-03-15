# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                # Run app with tsx (pass args after --)
npm run dev -- --org foo   # Run with specific org
npm run build              # Compile to dist/ with tsup (ESM)
npm run start              # Run compiled build
npm run typecheck          # TypeScript strict check (tsc --noEmit)
npm run lint               # ESLint
npm run lint:fix           # ESLint with auto-fix
npm run format             # Prettier write
npm run format:check       # Prettier check
npm test                   # Run vitest unit tests (107+ tests)
npm run test:watch         # Run vitest in watch mode
```

Pre-commit hook (husky + lint-staged) runs `prettier --write` and `eslint --fix` on staged `.ts`/`.tsx` files.

## Architecture

Full-screen terminal app using **React 18 + Ink 5** (React renderer for CLIs). Data comes from **GitHub GraphQL API** via `@octokit/graphql` and **Jira Cloud REST API** via Basic auth. Tests use **vitest**.

### Directory Structure

```
src/
├── api/                         # GraphQL client, queries, mutations, types
│   ├── client.ts                # Creates authenticated GraphQL client
│   ├── queries.ts               # PR search + detail queries
│   ├── dependency-queries.ts    # Dependency search queries
│   ├── mutations.ts             # PR review/comment mutations
│   ├── azure-auth.ts            # Azure DevOps PAT auth helper
│   ├── azure-client.ts          # Azure DevOps REST API client
│   ├── jira-client.ts           # Jira Cloud REST API client (Basic auth, search, issue detail, myself)
│   └── types.ts                 # All shared TypeScript interfaces
├── ui/                          # Reusable UI primitives (barrel-exported via index.ts)
│   ├── index.ts                 # Barrel export for all ui/ modules
│   ├── theme.ts                 # Centralized color + icon constants
│   ├── router.ts                # RouterProvider, useRouter, defineRoutes, RouteRenderer, Outlet, useOutlet
│   ├── router.test.tsx          # Router tests (param extraction, navigation, goBack, nested routes)
│   ├── route-shortcuts.ts       # All keyboard shortcuts grouped by route path
│   ├── route-shortcuts.test.ts  # Tests for route-based shortcut system
│   ├── tabs.ts                  # TABS array, getTabViews, getTabNumberKeys, getBaseRoute
│   ├── tabs.test.ts             # Tests for tab system
│   ├── selectable-list-item.tsx # Blue-bg selected row component
│   ├── selectable-list-item.test.tsx # Tests for selectable list item
│   ├── tab-item.tsx             # Single tab label component
│   ├── use-list-viewport.ts     # Viewport windowing hook for scrollable lists
│   ├── overlay.tsx              # Overlay wrapper component
│   ├── overlay.test.tsx         # Tests for overlay component
│   ├── status-bar-layout.tsx    # Status bar wrapper
│   └── keyboard-hint.tsx        # Dim hint text component
├── views/                       # View modules (all use nested routes via Outlet)
│   ├── prs/                     # PR dashboard view
│   │   ├── index.tsx            # Re-exports PrsLayout
│   │   ├── prs-context.ts       # PrsContext — shared state for all PR child routes
│   │   ├── prs-layout.tsx       # PrsLayout — parent layout, owns state + own header
│   │   ├── pr-list-view.tsx     # PrListView — index route (list + sidebar + shortcuts)
│   │   ├── prs-help-view.tsx    # PrsHelpView — help overlay route
│   │   ├── sidebar.tsx          # Pinned repos sidebar
│   │   ├── sidebar.test.tsx     # Tests for sidebar
│   │   ├── pr-list.tsx          # Scrollable PR list
│   │   ├── pr-row.tsx           # Single PR row
│   │   ├── pr-row.test.tsx      # Tests for PR row
│   │   ├── status-bar.tsx       # Filter, count, refresh timer
│   │   ├── repo-search.tsx      # Repo search overlay (child route)
│   │   ├── notifications-view.tsx # GitHub notifications panel (child route)
│   │   └── pr-detail/           # PR detail panel (child route)
│   │       ├── index.tsx        # Tab switching + scroll
│   │       ├── overview-tab.tsx # PR metadata, description, checks
│   │       ├── files-tab.tsx    # Changed file list + expansion
│   │       └── diff-view.tsx    # Patch line rendering
│   ├── dependencies/            # Dependency tracker view
│   │   ├── index.tsx            # Re-exports DepsLayout
│   │   ├── deps-context.ts     # DepsContext — shared state for all dep child routes
│   │   ├── deps-layout.tsx     # DepsLayout — parent layout, owns state
│   │   ├── deps-list-view.tsx  # DepsListView — index route (list + sidebar + shortcuts)
│   │   ├── deps-help-view.tsx  # DepsHelpView — help overlay route
│   │   ├── package-list.tsx     # Tracked packages sidebar
│   │   ├── package-search.tsx   # Package name search overlay (child route)
│   │   ├── dep-results.tsx      # Repos using a tracked package
│   │   └── dep-status-bar.tsx   # Dep view status bar
│   ├── pipelines/               # Azure DevOps pipelines view
│   │   ├── index.tsx            # Re-exports PipelinesLayout
│   │   ├── pipelines-context.ts # PipelinesContext — shared state
│   │   ├── pipelines-layout.tsx # PipelinesLayout — parent layout, owns state
│   │   ├── pipelines-list-view.tsx # PipelinesListView — index route
│   │   ├── pipelines-help-view.tsx # PipelinesHelpView — help overlay route
│   │   ├── pipeline-sidebar.tsx # Pinned pipelines sidebar
│   │   ├── pipeline-list.tsx    # Pipeline build list
│   │   ├── pipeline-row.tsx     # Single pipeline row
│   │   ├── pipeline-runs.tsx    # Pipeline runs detail panel (child route)
│   │   ├── pipeline-search.tsx  # Pipeline search overlay (child route)
│   │   └── status-bar.tsx       # Pipeline status bar
│   ├── releases/                # Azure DevOps releases view
│   │   ├── index.tsx            # Re-exports ReleasesLayout
│   │   ├── releases-context.ts  # ReleasesContext — shared state
│   │   ├── releases-layout.tsx  # ReleasesLayout — parent layout, owns state
│   │   ├── releases-list-view.tsx # ReleasesListView — index route
│   │   ├── releases-help-view.tsx # ReleasesHelpView — help overlay route
│   │   ├── definition-sidebar.tsx # Release definitions sidebar
│   │   ├── definition-search.tsx  # Definition search overlay (child route)
│   │   ├── release-list.tsx     # Release list
│   │   ├── release-row.tsx      # Single release row
│   │   └── status-bar.tsx       # Release status bar
│   ├── projects/                # Local projects runner view
│   │   ├── index.tsx            # Re-exports ProjectsLayout
│   │   ├── projects-context.ts  # ProjectsContext — shared state
│   │   ├── projects-layout.tsx  # ProjectsLayout — parent layout, owns state
│   │   ├── projects-list-view.tsx # ProjectsListView — index route
│   │   ├── projects-help-view.tsx # ProjectsHelpView — help overlay route
│   │   ├── project-list.tsx     # Project list with status indicators
│   │   ├── log-panel.tsx        # Live log detail panel (right side)
│   │   └── add-project.tsx      # Multi-step add project wizard
│   ├── jira/                    # Jira issue tracker view
│   │   ├── index.tsx            # Re-exports JiraLayout
│   │   ├── jira-context.ts      # JiraContext — shared state for all Jira child routes
│   │   ├── jira-layout.tsx      # JiraLayout — parent layout, owns state
│   │   ├── issue-list-view.tsx  # JiraIssueListView — index route (list + shortcuts)
│   │   ├── jira-help-view.tsx   # JiraHelpView — help overlay route
│   │   ├── issue-list.tsx       # Issue list grouped by status
│   │   ├── issue-row.tsx        # Single issue row
│   │   ├── status-bar.tsx       # Jira status bar (filter mode, project, counts)
│   │   ├── status-filter.tsx    # Status filter overlay (child route)
│   │   ├── sort-overlay.tsx     # Sort overlay (child route)
│   │   ├── member-select.tsx    # Team member select overlay (child route)
│   │   └── issue-detail/        # Issue detail panel (child route)
│   │       ├── index.tsx        # Tab switching (overview/comments/subtasks) + scroll
│   │       ├── overview-tab.tsx # Issue metadata, description, status
│   │       ├── comments-tab.tsx # Issue comments
│   │       └── subtasks-tab.tsx # Subtask list
│   └── config/                  # Configuration view
│       ├── index.tsx            # Re-exports ConfigLayout
│       ├── config-layout.tsx    # ConfigLayout — parent layout (overlay routing only)
│       ├── config-main-view.tsx # ConfigMainView — index route (tool sections)
│       └── config-help-view.tsx # ConfigHelpView — help overlay route
├── components/                  # Shared cross-view components
│   ├── view-header.tsx          # Shared header (TabBar + Shortcuts bar, reads from route-shortcuts)
│   ├── help-overlay.tsx         # Keyboard shortcut help overlay (reads from route-shortcuts)
│   ├── tab-bar.tsx              # View switcher tab bar (reads from tabs.ts)
│   └── shortcuts.tsx            # Bottom shortcut hint bar
├── hooks/                       # React hooks
│   ├── use-config.ts            # Config read/write (~/.config/github-pr-dash/)
│   ├── use-pull-requests.ts     # PR search + pagination + polling
│   ├── use-pr-detail.ts         # Single PR detail data
│   ├── use-dependency-search.ts # Dependency search with disk cache
│   ├── use-notifications.ts     # GitHub notifications
│   ├── use-repos.ts             # Org repo list fetch
│   ├── use-screen-size.ts       # Terminal dimensions
│   ├── use-github-auth.ts       # Auth token resolution
│   ├── use-route-shortcuts.ts   # Route-aware shortcut hook (auto-scopes from current route)
│   ├── use-local-processes.ts   # Child process management for local projects
│   ├── use-pipelines.ts         # Azure DevOps pipeline data
│   ├── use-pipeline-runs.ts     # Pipeline run history
│   ├── use-releases.ts          # Azure DevOps release data
│   ├── use-jira-issues.ts       # Jira issue search (React Query, JQL, filter modes)
│   ├── use-jira-issue-detail.ts # Single Jira issue detail (React Query)
│   └── use-theme.ts             # Theme state management
├── utils/                       # Pure utility functions (each has *.test.ts)
│   ├── time.ts                  # Relative time formatting
│   ├── time-buckets.ts          # Group PRs by time period
│   ├── status.ts                # PR review + CI status → icon/color mapping
│   ├── columns.ts               # Column width calculation
│   ├── clipboard.ts             # macOS pbcopy wrapper
│   ├── markdown.ts              # Markdown-to-terminal rendering
│   ├── pr-sort.ts               # PR list comparison + sorting
│   ├── config-migration.ts      # Config v1 → v2 migration
│   ├── reviewers.ts             # Reviewer info + hex color conversion
│   ├── fuzzy.ts                 # Fuzzy match/score for search
│   ├── jira-status.ts           # Jira status grouping, icons, colors (type/priority)
│   ├── azure-status.ts          # Azure pipeline/release status → icon/color mapping
│   ├── query-persister.ts       # React Query file-based cache persistence
│   └── browser.ts               # Shared openInBrowser utility (uses 'open' package)
├── app.tsx                      # AppContext.Provider + RouterProvider + ViewHeader shell
├── app-context.ts               # AppContext (React context providing shared data to all views)
├── routes.ts                    # Route definitions mapping paths to view components
├── index.tsx                    # Entry point: auth, client, alt-screen, render
└── patched-stdout.ts            # Buffered stdout to avoid fullscreen flicker
```

### Entry & Auth Flow

`src/index.tsx` resolves auth (`gh auth token` -> `GITHUB_TOKEN` env -> exit), creates a single GraphQL client, parses `--org` arg (or `GITHUB_ORG` env), enters alternate screen buffer, then renders `<App>`. The `App` component wraps everything in `<RouterProvider routes={routes} initialRoute="prs">`, then `AppInner` provides `<AppContext.Provider>` with all shared state before rendering `<RouteRenderer>`.

### View Architecture (Router + Nested Routes)

All 7 views use the same nested route pattern. `src/app.tsx` wraps the app in a `RouterProvider` (from `src/ui/router.ts`) and an `AppContext.Provider` (from `src/app-context.ts`). It renders a shared `ViewHeader` component (TabBar + Shortcuts bar) above the `RouteRenderer`, which matches the current route to a component defined in `src/routes.ts`. Navigation uses slash-separated route strings (e.g. `"prs"`, `"jira/detail/UUX-1629"`, `"config"`).

The architecture consists of 5 key files:
- **`src/app-context.ts`** — `AppContext` (React context) and `useAppContext()` hook. Provides all shared data to views: config + all config mutators, GraphQL client, token, org repos, dependency data, notifications, layout dimensions, and `onQuit`. Views call `useAppContext()` to access everything they need — no props are passed from `app.tsx` to views.
- **`src/routes.ts`** — Route definitions created via `defineRoutes()`. All 7 views are `NestedRouteDef` entries with a `component` (parent layout) and `children` (child routes). The parent layout renders `<Outlet />` and child routes are mapped to separate components. Config sub-routes are local state only (edit dialogs use `position="absolute"` overlays within the main view).
- **`src/ui/router.ts`** — `RouterProvider`, `useRouter()`, `defineRoutes()`, `RouteRenderer`, `Outlet`, `useOutlet()`. Routes support `:param` placeholders and optional `layout: "overlay"` flag. `defineRoutes()` flattens nested route definitions internally. `useRouter()` provides `{ route, params, baseRoute, matchedPath, navigate, goBack }` — `matchedPath` is the pattern (e.g. `"jira/detail/:key"`) used for shortcut lookup via `getShortcutRoute()`. `RouteRenderer` wraps the child in `OutletContext` and renders the parent; the parent calls `<Outlet />` to render the child.
- **`src/ui/route-shortcuts.ts`** — `ROUTE_SHORTCUTS` object with all keyboard shortcuts grouped by route path, plus `ROUTE_BAR` for bottom bar action lists per route. `getShortcutRoute(matchedPath)` strips `:param` segments for lookup (e.g. `"jira/detail/:key"` -> `"jira/detail"`). Query helpers: `getBarShortcuts(route, matchedPath)`, `getHelpShortcuts(route, matchedPath)`, `matchShortcut(input, key, route, matchedPath)`.
- **`src/ui/tabs.ts`** — `TABS` array defining tab order (PRs/Deps/Pipelines/Releases/Projects/Jira/Config), `getTabViews()`, `getTabNumberKeys()`, `getBaseRoute()`.

#### Consistent View Decomposition Pattern

Every view follows the same 4-file pattern:

| File | Role |
|------|------|
| `*-context.ts` | React context + hook (e.g. `PrsContext`, `usePrsContext()`) for view-specific shared state |
| `*-layout.tsx` | Parent layout component: owns state, provides Context, renders `<Outlet />`. Handles overlay vs full-child rendering. |
| `*-list-view.tsx` (or `*-main-view.tsx`) | Index route: main UI with `useRouteShortcuts` for view-specific key bindings |
| `*-help-view.tsx` | Help overlay: thin wrapper calling `useRouteShortcuts({})` to activate global help-close behavior |

Each view's `index.tsx` re-exports the layout component (e.g. `export { PrsLayout } from "./prs-layout.tsx"`).

**All views take zero props.** Layout components call `useAppContext()` for shared data, own view-specific state, and provide it via their context. Child route components access view state via the context hook (e.g. `usePrsContext()`, `useDepsContext()`).

The 7 views and their layouts:
- **PrsLayout** (`views/prs/prs-layout.tsx`) — manages its own header/TabBar instead of using the shared `ViewHeader`. Children: `PrListView`, `PrsHelpView`, `PRDetailPanel`, `NotificationsView`, `RepoSearch`.
- **DepsLayout** (`views/dependencies/deps-layout.tsx`) — Children: `DepsListView`, `DepsHelpView`, `PackageSearch`.
- **PipelinesLayout** (`views/pipelines/pipelines-layout.tsx`) — Children: `PipelinesListView`, `PipelinesHelpView`, `PipelineSearch`, `PipelineRuns`.
- **ReleasesLayout** (`views/releases/releases-layout.tsx`) — Children: `ReleasesListView`, `ReleasesHelpView`, `DefinitionSearch`.
- **ProjectsLayout** (`views/projects/projects-layout.tsx`) — Children: `ProjectsListView`, `ProjectsHelpView`.
- **JiraLayout** (`views/jira/jira-layout.tsx`) — Children: `JiraIssueListView`, `JiraHelpView`, `IssueDetail`, `SortOverlay`, `StatusFilter`, `MemberSelect`.
- **ConfigLayout** (`views/config/config-layout.tsx`) — Minimal layout (overlay routing only, no context). Children: `ConfigMainView`, `ConfigHelpView`. Config edit dialogs use local state with `position="absolute"` overlays inside `ConfigMainView`.

#### useRouteShortcuts Behavior

- **Auto-scope:** The hook automatically scopes to the current route from `RouterContext` -- no manual `scope` parameter needed.
- **`active` flag:** Set to `false` to disable during text input modes (search typing, etc.).
- **`onUnhandled`:** Fallback for keys not matching any shortcut.
- **Help overlay:** When on a `/help` route, `?` and `Esc` automatically close it (navigate back). Tab switching and quit still work from help overlays.
- **Global shortcuts** (quit, help, tab switch) are always active within any route.
- **Sub-views with raw `useInput`:** Components like `PRDetailPanel`, `NotificationsView`, and `PipelineRuns` that use raw `useInput` for scrolling also call `useRouteShortcuts({})` to get global shortcuts (quit, help, tab switch).

#### goBack() Navigation

The router maintains a history stack. `goBack()` pops the previous route from the stack, enabling natural back-navigation from detail views and overlays. This is useful for parameterized routes where the caller route is not statically known.

#### Nested Routes + Outlet Pattern

In `routes.ts`, every view is defined as a `NestedRouteDef` with a `component` (parent layout) and `children` (child routes):

```tsx
pipelines: {
  component: PipelinesLayout,
  children: {
    "": { component: PipelinesListView },             // index route
    help: { component: PipelinesHelpView, layout: "overlay" },
    search: { component: PipelineSearch, layout: "overlay" },
    runs: { component: PipelineRuns },                 // full-screen child
  },
}
```

`defineRoutes()` flattens this into routes like `"pipelines"`, `"pipelines/help"`, `"pipelines/search"`, `"pipelines/runs"`. Each flattened entry stores both `parentComponent` and `childComponent`.

Layout components use `useOutlet()` to conditionally render overlays centered vs full children directly:

```tsx
function PipelinesLayout() {
  const outlet = useOutlet(); // { layout, isOverlay } or null
  return (
    <PipelinesContext.Provider value={ctx}>
      {outlet?.isOverlay ? (
        <Box alignItems="center" justifyContent="center"><Outlet /></Box>
      ) : (
        <Outlet />
      )}
    </PipelinesContext.Provider>
  );
}
```

**State flow:** `AppContext` (global) -> Layout (owns view state) -> ViewContext.Provider -> child components via `useViewContext()`.

#### Overlay Types

**Route-based overlays** (search, help, member select, sort) are child routes with `layout: "overlay"` in `routes.ts`. The parent layout detects `outlet?.isOverlay` and centers the child. These are separate components that navigate via `navigate("view/search")`.

**Local state overlays** (config edit dialogs, confirm kill dialogs in projects) use `position="absolute"` centered on screen, rendered within the index route's JSX tree. These are used for `TextInput`-based overlays that need raw keyboard input. Config sub-routes (e.g. `config/addOrg`) are tracked in the router for shortcut scoping but rendered by local state within `ConfigMainView`.

### State & Data

No external state management library. Shared app-level state (config, client, repos, notifications, dependencies) is provided via `AppContext` from `src/app-context.ts` and accessed in views via `useAppContext()`. Each view manages its own view-specific state via local React hooks.

- **useConfig** — reads/writes `~/.config/github-pr-dash/config.json` (v2 format: multi-org, pinned repos, tracked packages, refresh interval, local projects, Jira settings). Auto-saves on mutation. Handles v1 → v2 migration.
- **usePullRequests** — builds a GitHub search query from pinned repos + filter mode, fetches via cursor-paginated GraphQL, polls on configurable interval (default 30s). Client-side filters by selected sidebar repo.
- **usePRDetail** — fetches full PR data (body, files, checks) for the detail panel.
- **useDependencySearch** — searches org repos for package usage with disk caching.
- **useNotifications** — fetches GitHub notifications with unread count.
- **useRepos** — fetches all org repos (for the repo search overlay only).
- **useJiraIssues** — builds JQL from project + filter mode (mine/team/person), fetches open + done issues via Jira REST API, React Query with configurable polling interval.
- **useJiraIssueDetail** — fetches full issue data (description, comments, subtasks) for the detail panel via React Query.

PR search query pattern: `is:pr is:open repo:org/repo1 repo:org/repo2 ...` with optional `author:` or `review-requested:` modifiers based on filter mode.

Jira JQL pattern: `project = KEY AND assignee = "accountId" AND statusCategory != Done ORDER BY status ASC, updated DESC` with filter mode variants (mine = current user, team = all, person = selected member).

- **useLocalProcesses** — manages child processes for local projects. Event-driven status tracking (spawn/close/error events), log capture (last 500 lines per process), dependency-aware start (auto-starts deps), cleanup on unmount.

### Local Projects Config

Projects are configured in `~/.config/github-pr-dash/config.json` under the `localProjects` array. Can be added via the TUI (+) or by editing the config file directly (press **e** in Config tab).

```json
{
  "localProjects": [
    {
      "name": "api",
      "path": "/Users/you/projects/my-api",
      "command": "npm run dev",
      "dependencies": [],
      "url": "http://localhost:3000"
    },
    {
      "name": "frontend",
      "path": "/Users/you/projects/my-frontend",
      "command": "npm run dev",
      "dependencies": ["api"],
      "url": "http://localhost:5173"
    }
  ]
}
```

Fields:
- **name** — display name (unique identifier)
- **path** — absolute path to project directory (used as cwd for the command)
- **command** — shell command to start the project (e.g. `npm run dev`, `dotnet run`)
- **dependencies** — array of other project names that must be running first
- **url** — (optional) URL to open in browser with **o** key

### Jira Config

Jira settings are stored in `~/.config/github-pr-dash/config.json` and can be edited via the Config tab (press 7). Jira uses API token authentication (Basic auth), not OAuth.

Config fields:
- **jiraSite** — Jira Cloud site hostname (e.g. `your-org.atlassian.net`)
- **jiraEmail** — email associated with the Jira account
- **jiraToken** — Jira API token (generate at https://id.atlassian.com/manage-profile/security/api-tokens)
- **jiraProject** — Jira project key (e.g. `PROJ`)
- **jiraAccountId** — current user's Jira account ID (auto-resolved via `/myself` endpoint)
- **jiraStatusOrder** — (optional) array of status names to control display order; defaults to `["In Progress", "Blocked", "In Review", "Ready for Test", "To Do", "Done"]`

### UI Primitives (`src/ui/`)

Reusable building blocks barrel-exported from `src/ui/index.ts`:
- **theme.ts** — `colors` and `icons` constants used throughout the app
- **router.ts** — `RouterProvider` wraps the app, `useRouter()` provides `{ route, params, baseRoute, matchedPath, navigate, goBack }`. `defineRoutes()` creates the route map from nested path definitions. `RouteRenderer` matches the current route and renders the component. `Outlet` renders the child route in nested layouts; `useOutlet()` returns `{ layout, isOverlay }` for conditional rendering.
- **route-shortcuts.ts** — `ROUTE_SHORTCUTS` object with all keyboard shortcuts grouped by route path, `ROUTE_BAR` with bottom bar action lists per route. `getShortcutRoute(matchedPath)` strips `:param` segments for lookup. Query helpers accept optional `matchedPath`: `getBarShortcuts(route, matchedPath)`, `getHelpShortcuts(route, matchedPath)`, `matchShortcut(input, key, route, matchedPath)`.
- **tabs.ts** — `TABS` array defining tab order: PRs (1) / Deps (2) / Pipelines (3) / Releases (4) / Projects (5) / Jira (6) / Config (7, always last). Helpers: `getTabViews()`, `getTabNumberKeys()`, `getBaseRoute()`.
- **SelectableListItem** — row with blue background when selected
- **TabItem** — single tab label component
- **useListViewport** — handles viewport windowing for scrollable lists
- **Overlay** — renders content as a floating panel over the main UI
- **StatusBarLayout** — consistent status bar wrapper
- **KeyboardHint** — dim hint text for keyboard shortcuts

Import these via `from "../ui/index.ts"` or directly (e.g. `from "../ui/router.ts"`, `from "../ui/route-shortcuts.ts"`).

### Shortcut System (Route-based)

All keyboard shortcuts are defined in `src/ui/route-shortcuts.ts` as `ROUTE_SHORTCUTS` -- an object keyed by route path. Each route maps key strings to `ShortcutDef` objects:
- `action` -- action name (e.g. `"open"`, `"filterMine"`)
- `key` -- trigger key (character or special: `"tab"`, `"return"`, `"escape"`, `"up"`, `"down"`, etc.)
- `label` -- short label for the bottom bar (optional; only entries with a label appear in the bar)
- `help` -- description for the help overlay

The special `_global` key defines shortcuts active on all routes (quit, help, tab switching).

Bottom bar configuration is in `ROUTE_BAR` -- a separate object mapping route paths to arrays of action names that should appear in the bar.

Query helpers (all accept optional `matchedPath` to handle parameterized routes via `getShortcutRoute()`):
- `getBarShortcuts(route, matchedPath?)` -- returns `[{key, label}]` for the bottom bar, using `ROUTE_BAR[route]` to select which actions to show
- `getHelpShortcuts(route, matchedPath?)` -- returns `[key, help]` pairs for the help overlay (route-specific + base route + globals)
- `matchShortcut(input, key, route, matchedPath?)` -- matches Ink's `useInput` args against the route's shortcuts; route-specific take precedence over globals
- `getShortcutRoute(matchedPath)` -- strips `:param` segments from a matched pattern (e.g. `"jira/detail/:key"` -> `"jira/detail"`) so shortcuts are looked up by the static prefix

**Adding a new shortcut:**
1. Add the `ShortcutDef` entry to `ROUTE_SHORTCUTS[route]` in `route-shortcuts.ts`
2. Add a handler for that action name in the view's `useRouteShortcuts` call
3. If it should appear in the bottom bar, add its action name to `ROUTE_BAR[route]`

**`useRouteShortcuts` behavior:** Auto-scopes from the current route via `RouterContext`. No manual scope needed -- the hook only fires handlers for shortcuts defined on the current route. Global shortcuts (quit, help, tab switching) are handled automatically. The `active` flag can disable shortcuts during text input modes.

**When to use `useRouteShortcuts` vs `useInput`:**
- `useRouteShortcuts` -- for discrete action shortcuts (open, close, navigate, filter). This is the default for all views and sub-views.
- `useInput` -- only for free-text input modes (search typing, comment typing) and as a `TextInput` companion (e.g. Escape to close an overlay). Overlays with only discrete keys (like `MemberSelect`, `SortOverlay`) should use `useRouteShortcuts`, not `useInput`.

### Status Mapping

`src/utils/status.ts` maps `reviewDecision` and `statusCheckRollup.state` from the GraphQL response to icons and colors defined in `src/ui/theme.ts`.

`src/utils/jira-status.ts` groups Jira issues by status name, maps status categories (`new`/`indeterminate`/`done`) to theme colors, and provides icons for issue types (bug, story, epic, task, sub-task) and priority levels.

`src/utils/azure-status.ts` maps Azure DevOps pipeline build results and release environment statuses to icons and theme colors.

## Code Conventions

- ESM throughout (`"type": "module"` in package.json)
- TypeScript strict mode; `.ts` extensions in imports (e.g., `./api/client.ts`)
- JSX uses `react-jsx` transform (no `React` import needed in components, but present in some files)
- `@typescript-eslint/no-explicit-any` is disabled — `any` is allowed for GraphQL response typing
- Unused variables prefixed with `_` are permitted
- Prettier: double quotes, semicolons, trailing commas, 80-char width
- Volta pins Node 20.20.0 / npm 10.8.2
- Tests co-located with source files as `*.test.ts(x)` in `src/utils/`, `src/ui/`, and `src/views/`
- View components organized by feature: `views/<name>/index.tsx` as entry point
- Shared UI primitives go in `src/ui/`, shared cross-view components go in `src/components/`
- Pure functions go in `src/utils/` with corresponding test files
