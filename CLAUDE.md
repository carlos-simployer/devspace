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

Full-screen terminal app using **React 18 + Ink 5** (React renderer for CLIs). Data comes from **GitHub GraphQL API** via `@octokit/graphql`, **Jira Cloud REST API** via Basic auth, **Azure DevOps REST API**, and **Slack Web API**. Tests use **vitest**.

### Directory Structure

```
src/
├── constants.ts                 # APP_NAME, DEFAULT_CONFIG_DIR, CACHE_DIR
├── api/                         # GraphQL client, queries, mutations, types
│   ├── client.ts                # Creates authenticated GraphQL client
│   ├── queries.ts               # PR search + detail queries
│   ├── dependency-queries.ts    # Dependency search queries
│   ├── mutations.ts             # PR review/comment mutations
│   ├── azure-auth.ts            # Azure DevOps PAT auth helper
│   ├── azure-client.ts          # Azure DevOps REST API client
│   ├── jira-client.ts           # Jira Cloud REST API client (Basic auth, search, issue detail, myself)
│   ├── slack-client.ts          # Slack Web API client (conversations, messages, reactions, presence)
│   └── types.ts                 # All shared TypeScript interfaces
├── ui/                          # Reusable UI primitives (barrel-exported via index.ts)
│   ├── index.ts                 # Barrel export for all ui/ modules
│   ├── theme.ts                 # Centralized color + icon + theme constants
│   ├── router.ts                # RouterProvider, useRouter, defineRoutes, RouteRenderer, Outlet, useOutlet
│   ├── router.test.tsx          # Router tests (param extraction, navigation, goBack, nested routes)
│   ├── route-shortcuts.ts       # All keyboard shortcuts grouped by route path
│   ├── route-shortcuts.test.ts  # Tests for route-based shortcut system
│   ├── tabs.ts                  # TABS array, getTabViews, getTabNumberKeys, getBaseRoute
│   ├── tabs.test.ts             # Tests for tab system
│   ├── panel.tsx                # Bordered section with title-in-border, focus color, item count, edge merging
│   ├── panel.test.tsx           # Tests for panel
│   ├── focus.ts                 # FocusProvider, useFocus, useFocusNode — focus management context
│   ├── focus.test.tsx           # Tests for focus system
│   ├── scroll-area.tsx          # Viewport container paired with ScrollBar
│   ├── scroll-area.test.tsx     # Tests for scroll area
│   ├── scroll-bar.tsx           # Vertical scroll indicator (proportional thumb + track)
│   ├── scroll-bar.test.tsx      # Tests for scroll bar
│   ├── dialog.tsx               # Dialog (solid-bg modal) + DialogLayer (content + dialog compositor)
│   ├── dialog.test.tsx          # Tests for dialog
│   ├── sidebar.tsx              # Generic sidebar with Panel + ScrollArea (replaces per-view sidebars)
│   ├── sidebar.test.tsx         # Tests for sidebar
│   ├── search-list.tsx          # Search dialog with fuzzy filter + selectable list
│   ├── search-list.test.tsx     # Tests for search list
│   ├── detail-panel.tsx         # Tabbed detail view with ScrollArea (PR detail, Jira detail, etc.)
│   ├── detail-panel.test.tsx    # Tests for detail panel
│   ├── confirm-dialog.tsx       # Confirmation dialog with selectable options
│   ├── confirm-dialog.test.tsx  # Tests for confirm dialog
│   ├── table-row.tsx            # TableRow + TableHeader — fixed-width columns with flex, truncation
│   ├── table-row.test.tsx       # Tests for table row
│   ├── create-view-store.ts     # Zustand store factory for per-view persisted state
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
│   │   ├── prs-store.ts         # Zustand store for persisted PR view state
│   │   ├── prs-layout.tsx       # PrsLayout — parent layout, owns state, FocusProvider
│   │   ├── pr-list-view.tsx     # PrListView — index route (list + sidebar + shortcuts)
│   │   ├── prs-help-view.tsx    # PrsHelpView — help overlay route
│   │   ├── sidebar.tsx          # Pinned repos sidebar (uses ui/Sidebar)
│   │   ├── sidebar.test.tsx     # Tests for sidebar
│   │   ├── pr-list.tsx          # Scrollable PR list
│   │   ├── pr-row.tsx           # Single PR row
│   │   ├── pr-row.test.tsx      # Tests for PR row
│   │   ├── status-bar.tsx       # Filter, count, refresh timer
│   │   ├── approve-overlay.tsx  # PR approval overlay (child route)
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
│   │   ├── deps-store.ts       # Zustand store for persisted deps view state
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
│   │   ├── pipelines-store.ts   # Zustand store for persisted pipeline view state
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
│   │   ├── releases-store.ts    # Zustand store for persisted release view state
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
│   │   ├── projects-store.ts    # Zustand store for persisted project view state
│   │   ├── projects-layout.tsx  # ProjectsLayout — parent layout, owns state
│   │   ├── projects-list-view.tsx # ProjectsListView — index route
│   │   ├── projects-help-view.tsx # ProjectsHelpView — help overlay route
│   │   ├── project-sidebar.tsx  # Project list sidebar with status indicators
│   │   ├── command-panel.tsx    # Command output / log panel (right side)
│   │   ├── log-panel.tsx        # Live log detail panel (right side)
│   │   ├── confirm-overlay.tsx  # Kill/stop confirmation overlay
│   │   └── add-project.tsx      # Multi-step add project wizard
│   ├── jira/                    # Jira issue tracker view
│   │   ├── index.tsx            # Re-exports JiraLayout
│   │   ├── jira-context.ts      # JiraContext — shared state for all Jira child routes
│   │   ├── jira-store.ts        # Zustand store for persisted Jira view state
│   │   ├── jira-layout.tsx      # JiraLayout — parent layout, owns state
│   │   ├── issue-list-view.tsx  # JiraIssueListView — index route (list + shortcuts)
│   │   ├── jira-help-view.tsx   # JiraHelpView — help overlay route
│   │   ├── issue-list.tsx       # Issue list grouped by status
│   │   ├── issue-row.tsx        # Single issue row
│   │   ├── status-bar.tsx       # Jira status bar (filter mode, project, counts)
│   │   ├── status-filter.tsx    # Status filter overlay (child route)
│   │   ├── sort-overlay.tsx     # Sort overlay (child route)
│   │   ├── member-select.tsx    # Team member select overlay (child route)
│   │   ├── transition-overlay.tsx # Issue status transition overlay (child route)
│   │   └── issue-detail/        # Issue detail panel (child route)
│   │       ├── index.tsx        # Tab switching (overview/comments/subtasks) + scroll
│   │       ├── overview-tab.tsx # Issue metadata, description, status
│   │       ├── comments-tab.tsx # Issue comments
│   │       └── subtasks-tab.tsx # Subtask list
│   ├── slack/                   # Slack messaging view
│   │   ├── slack-context.ts     # SlackContext — shared state for all Slack child routes
│   │   ├── slack-store.ts       # Zustand store for persisted Slack view state
│   │   ├── slack-layout.tsx     # SlackLayout — parent layout, owns state
│   │   ├── slack-list-view.tsx  # SlackListView — index route (channel sidebar + messages)
│   │   ├── slack-help-view.tsx  # SlackHelpView — help overlay route
│   │   ├── channel-sidebar.tsx  # Pinned channels sidebar
│   │   ├── message-list.tsx     # Message list for selected channel
│   │   ├── message-row.tsx      # Single message row
│   │   ├── slack-status-bar.tsx # Slack status bar
│   │   ├── slack-channel-search.tsx # Channel search overlay (child route)
│   │   ├── slack-emoji-picker.tsx   # Emoji reaction picker overlay (child route)
│   │   ├── slack-status-view.tsx    # Status set overlay (child route)
│   │   └── slack-thread-view.tsx    # Thread detail view (child route)
│   ├── log/                     # Log overlay (shared across all views)
│   │   └── log-overlay.tsx      # LogOverlayView — ring buffer display, accessible via L key
│   └── config/                  # Configuration view
│       ├── index.tsx            # Re-exports ConfigLayout
│       ├── config-layout.tsx    # ConfigLayout — parent layout (overlay routing only)
│       ├── config-main-view.tsx # ConfigMainView — index route (tool sections: GitHub/Azure/Jira/Slack/System)
│       └── config-help-view.tsx # ConfigHelpView — help overlay route
├── components/                  # Shared cross-view components
│   ├── view-header.tsx          # Shared header (TabBar + Shortcuts bar, reads from route-shortcuts)
│   ├── help-overlay.tsx         # Keyboard shortcut help overlay (reads from route-shortcuts)
│   ├── tab-bar.tsx              # View switcher tab bar (reads from tabs.ts)
│   ├── shortcuts.tsx            # Bottom shortcut hint bar
│   └── quit-confirm.tsx         # Quit confirmation dialog
├── hooks/                       # React hooks
│   ├── use-config.ts            # Config read/write (~/.config/devhub/)
│   ├── use-pull-requests.ts     # PR search + pagination + polling
│   ├── use-pr-detail.ts         # Single PR detail data
│   ├── use-dependency-search.ts # Dependency search with disk cache
│   ├── use-notifications.ts     # GitHub notifications
│   ├── use-repos.ts             # Org repo list fetch
│   ├── use-screen-size.ts       # Terminal dimensions
│   ├── use-github-auth.ts       # Auth token resolution
│   ├── use-route-shortcuts.ts   # Route-aware shortcut hook (auto-scopes, focus-aware dispatch)
│   ├── use-text-input.ts        # Reusable text capture hook (query state + handleInput)
│   ├── use-text-input.test.ts   # Tests for text input hook
│   ├── use-local-processes.ts   # Child process management for local projects
│   ├── use-pipelines.ts         # Azure DevOps pipeline data
│   ├── use-pipeline-runs.ts     # Pipeline run history
│   ├── use-releases.ts          # Azure DevOps release data
│   ├── use-jira-issues.ts       # Jira issue search (React Query, JQL, filter modes)
│   ├── use-jira-issue-detail.ts # Single Jira issue detail (React Query)
│   ├── use-slack-auth.ts        # Slack auth + identity resolution via tokens.ts
│   ├── use-slack-channels.ts    # Slack channel list fetch
│   ├── use-slack-messages.ts    # Slack message history for selected channel
│   ├── use-slack-mutations.ts   # Slack write operations (post, react, delete, set status)
│   ├── use-slack-presence.ts    # Slack user presence tracking
│   ├── use-slack-thread.ts      # Slack thread replies fetch
│   ├── use-slack-users.ts       # Slack user cache + lookup
│   ├── use-terminal-title.ts    # Terminal tab title updates
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
│   ├── config-file.ts           # Centralized config.json read + path helper
│   ├── tokens.ts                # Secure token store (tokens.json, 0600 perms)
│   ├── cache-migration.ts       # Migrate cache files from ~/.config/ to ~/.cache/
│   ├── logger.ts                # Ring-buffer logger with file output + React subscription
│   ├── reviewers.ts             # Reviewer info + hex color conversion
│   ├── fuzzy.ts                 # Fuzzy match/score for search
│   ├── jira-status.ts           # Jira status grouping, icons, colors (type/priority)
│   ├── azure-status.ts          # Azure pipeline/release status → icon/color mapping
│   ├── query-persister.ts       # React Query file-based cache persistence
│   ├── browser.ts               # Shared openInBrowser utility (uses 'open' package)
│   ├── slack-format.ts          # Slack mrkdwn → terminal rendering
│   └── slack-links.ts           # Slack deep link URL builders
├── app.tsx                      # AppContext.Provider + RouterProvider + ViewHeader shell
├── app-context.ts               # AppContext (React context providing shared data to all views)
├── routes.ts                    # Route definitions mapping paths to view components
├── index.tsx                    # Entry point: migrations, auth, client, alt-screen, render
└── patched-stdout.ts            # Buffered stdout to avoid fullscreen flicker
```

### App Constants (`src/constants.ts`)

Centralizes directory paths and the app name:
- **`APP_NAME`** — `"devhub"` (display name, used in logs)
- **`DEFAULT_CONFIG_DIR`** — `~/.config/devhub/` (config + tokens)
- **`CACHE_DIR`** — `~/.cache/devhub/` (query cache, dep cache, log file)

`DIR_NAME` is private and decoupled from `APP_NAME`, so renaming the display name does not move config/cache directories. All modules import paths from `constants.ts` instead of hardcoding `"devhub"`.

### Entry & Auth Flow

`src/index.tsx` runs startup migrations (`migrateTokensFromConfig()`, `migrateCacheFiles()`), then resolves the GitHub token via `resolveGithubToken()` (tokens.json -> `gh auth token` CLI -> `GITHUB_TOKEN` env -> exit). It creates a single GraphQL client, parses `--org` arg (or `GITHUB_ORG` env), enters alternate screen buffer, then renders `<App>`. The `App` component wraps everything in `<RouterProvider routes={routes} initialRoute="prs">`, then `AppInner` provides `<AppContext.Provider>` with all shared state before rendering `<RouteRenderer>`.

### View Architecture (Router + Nested Routes)

All 8 views use the same nested route pattern. `src/app.tsx` wraps the app in a `RouterProvider` (from `src/ui/router.ts`) and an `AppContext.Provider` (from `src/app-context.ts`). It renders a shared `ViewHeader` component (TabBar + Shortcuts bar) above the `RouteRenderer` for all views (including PRs -- there is no per-view header override). The `RouteRenderer` matches the current route to a component defined in `src/routes.ts`. Navigation uses slash-separated route strings (e.g. `"prs"`, `"jira/detail/UUX-1629"`, `"slack"`, `"config"`).

The architecture consists of 5 key files:
- **`src/app-context.ts`** — `AppContext` (React context) and `useAppContext()` hook. Provides all shared data to views: config + all config mutators, GraphQL client, token, org repos, dependency data, notifications, layout dimensions, and `onQuit`. Views call `useAppContext()` to access everything they need — no props are passed from `app.tsx` to views.
- **`src/routes.ts`** — Route definitions created via `defineRoutes()`. All 8 views are `NestedRouteDef` entries with a `component` (parent layout) and `children` (child routes). The parent layout renders `<Outlet />` and child routes are mapped to separate components. Every view includes a `logs` child route (overlay) pointing to the shared `LogOverlayView`. Config sub-routes are local state only (edit dialogs use `position="absolute"` overlays within the main view).
- **`src/ui/router.ts`** — `RouterProvider`, `useRouter()`, `defineRoutes()`, `RouteRenderer`, `Outlet`, `useOutlet()`. Routes support `:param` placeholders and optional `layout: "overlay"` flag. `defineRoutes()` flattens nested route definitions internally. `useRouter()` provides `{ route, params, baseRoute, matchedPath, navigate, goBack }` — `matchedPath` is the pattern (e.g. `"jira/detail/:key"`) used for shortcut lookup via `getShortcutRoute()`. `RouteRenderer` wraps the child in `OutletContext` and renders the parent; the parent calls `<Outlet />` to render the child.
- **`src/ui/route-shortcuts.ts`** — `ROUTE_SHORTCUTS` object with all keyboard shortcuts grouped by route path, plus `ROUTE_BAR` for bottom bar action lists per route. `getShortcutRoute(matchedPath)` strips `:param` segments for lookup (e.g. `"jira/detail/:key"` -> `"jira/detail"`). Query helpers: `getBarShortcuts(route, matchedPath)`, `getHelpShortcuts(route, matchedPath)`, `matchShortcut(input, key, route, matchedPath)`.
- **`src/ui/tabs.ts`** — `TABS` array defining tab order (PRs/Jira/Projects/Pipelines/Releases/Deps/Slack/Config), `getTabViews()`, `getTabNumberKeys()`, `getBaseRoute()`.

#### Consistent View Decomposition Pattern

Every view follows the same 5-file pattern:

| File | Role |
|------|------|
| `*-context.ts` | React context + hook (e.g. `PrsContext`, `usePrsContext()`) for view-specific shared state |
| `*-store.ts` | Zustand vanilla store for state that persists across tab switches (focus, indices, filter mode). Created via `createViewStore()` from `src/ui/create-view-store.ts`. |
| `*-layout.tsx` | Parent layout component: owns state, wraps in `FocusProvider` + `ViewContext.Provider`, renders `<Outlet />`. Includes `FocusSync` component to sync focus back to the Zustand store. |
| `*-list-view.tsx` (or `*-main-view.tsx`) | Index route: main UI with `useRouteShortcuts` for view-specific key bindings, uses `focusHandlers` for focus-aware dispatch |
| `*-help-view.tsx` | Help overlay: thin wrapper calling `useRouteShortcuts({})` to activate global help-close behavior |

Each view's `index.tsx` re-exports the layout component (e.g. `export { PrsLayout } from "./prs-layout.tsx"`).

**All views take zero props.** Layout components call `useAppContext()` for shared data, own view-specific state, and provide it via their context. Child route components access view state via the context hook (e.g. `usePrsContext()`, `useDepsContext()`).

The 8 views and their layouts (every view also has a `logs` child route for the shared `LogOverlayView`):
- **PrsLayout** (`views/prs/prs-layout.tsx`) — Uses the shared `ViewHeader` like all other views. Wraps in `FocusProvider` + `PrsContext.Provider`. Children: `PrListView`, `PrsHelpView`, `PRDetailPanel`, `NotificationsView`, `RepoSearch`, `ApproveOverlay`.
- **DepsLayout** (`views/dependencies/deps-layout.tsx`) — Children: `DepsListView`, `DepsHelpView`, `PackageSearch`.
- **PipelinesLayout** (`views/pipelines/pipelines-layout.tsx`) — Children: `PipelinesListView`, `PipelinesHelpView`, `PipelineSearch`, `PipelineRuns`.
- **ReleasesLayout** (`views/releases/releases-layout.tsx`) — Children: `ReleasesListView`, `ReleasesHelpView`, `DefinitionSearch`.
- **ProjectsLayout** (`views/projects/projects-layout.tsx`) — Children: `ProjectsListView`, `ProjectsHelpView`.
- **JiraLayout** (`views/jira/jira-layout.tsx`) — Children: `JiraIssueListView`, `JiraHelpView`, `IssueDetail`, `SortOverlay`, `StatusFilter`, `MemberSelect`, `TransitionOverlay`.
- **SlackLayout** (`views/slack/slack-layout.tsx`) — Children: `SlackListView`, `SlackHelpView`, `SlackThreadView`, `SlackChannelSearch`, `SlackEmojiPicker`, `SlackStatusView`.
- **ConfigLayout** (`views/config/config-layout.tsx`) — Minimal layout (overlay routing only, no context). Children: `ConfigMainView`, `ConfigHelpView`. Config edit dialogs use local state with `position="absolute"` overlays inside `ConfigMainView`. Config sections: GitHub, Azure, Jira, Slack, System.

#### useRouteShortcuts Behavior

- **Auto-scope:** The hook automatically scopes to the current route from `RouterContext` -- no manual `scope` parameter needed.
- **`active` flag:** Set to `false` to disable during text input modes (search typing, etc.).
- **`onUnhandled`:** Fallback for keys not matching any shortcut.
- **`focusHandlers`:** Per-focus-node handler map for focus-aware dispatch. When provided, left/right arrow keys auto-wire to `focusPrev`/`focusNext` unless a handler is explicitly defined for those actions. See "Focus-Aware Shortcut Dispatch" below.
- **Help overlay:** When on a `/help` route, `?` and `Esc` automatically close it (navigate back). Tab switching and quit still work from help overlays.
- **Global shortcuts** (quit, help, logs, tab switch) are always active within any route.
- **Sub-views with raw `useInput`:** Components like `PRDetailPanel`, `NotificationsView`, and `PipelineRuns` that use raw `useInput` for scrolling also call `useRouteShortcuts({})` to get global shortcuts (quit, help, logs, tab switch).

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
    logs: { component: LogOverlayView, layout: "overlay" }, // shared log overlay
    search: { component: PipelineSearch, layout: "overlay" },
    runs: { component: PipelineRuns },                 // full-screen child
  },
}
```

`defineRoutes()` flattens this into routes like `"pipelines"`, `"pipelines/help"`, `"pipelines/logs"`, `"pipelines/search"`, `"pipelines/runs"`. Each flattened entry stores both `parentComponent` and `childComponent`.

Layout components use `useOutlet()` to conditionally render overlays. When an overlay is active, the index view is always rendered as the background layer, with `<Outlet />` positioned absolutely on top:

```tsx
function PipelinesLayout() {
  const outlet = useOutlet(); // { layout, isOverlay } or null
  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus={focus}>
      <PipelinesContext.Provider value={ctx}>
        <FocusSync setFocus={setFocus} />
        <Box height={contentHeight} width={width}>
          {/* Main content — always show index view */}
          <Box height={contentHeight} width={width} flexDirection="column">
            {isOverlay ? <PipelinesListView /> : <Outlet />}
          </Box>
          {/* Overlay layer — dialog on top */}
          {isOverlay && (
            <Box position="absolute" width={width} height={contentHeight}
              alignItems="center" justifyContent="center">
              <Outlet />
            </Box>
          )}
        </Box>
      </PipelinesContext.Provider>
    </FocusProvider>
  );
}
```

**State flow:** `AppContext` (global) -> Layout (wraps `FocusProvider` + owns view state) -> ViewContext.Provider -> child components via `useViewContext()`. `FocusSync` syncs `FocusProvider.focusedId` back to the Zustand store so focus persists across tab switches.

#### Overlay Types

**Route-based overlays** (search, help, member select, sort) are child routes with `layout: "overlay"` in `routes.ts`. The parent layout detects `outlet?.isOverlay` and renders the index view as a background layer, with the overlay centered on top via `position="absolute"`. These are separate components that navigate via `navigate("view/search")`. Many route-based overlays now use shared UI primitives like `SearchList`, `ConfirmDialog`, or `Dialog`.

**Local state overlays** (config edit dialogs, confirm kill dialogs in projects) use `position="absolute"` centered on screen, rendered within the index route's JSX tree via `DialogLayer`. These are used for `TextInput`-based overlays that need raw keyboard input. Config sub-routes (e.g. `config/addOrg`) are tracked in the router for shortcut scoping but rendered by local state within `ConfigMainView`.

### State & Data

Shared app-level state (config, client, repos, notifications, dependencies) is provided via `AppContext` from `src/app-context.ts` and accessed in views via `useAppContext()`.

**Per-view persisted state** uses **Zustand** vanilla stores (one per view) to survive tab switches. The `createViewStore()` factory in `src/ui/create-view-store.ts` auto-generates `set*` setters for every field. Each view's `*-store.ts` creates a store with defaults (focus area, selected indices, filter mode, sort mode), and the layout component reads it via `useStore(viewStore)`. Example:

```ts
// prs-store.ts
export const prsStore = createViewStore({
  focus: "sidebar" as FocusArea,
  sidebarIndex: 0,
  listIndex: 0,
  filterMode: "all" as FilterMode,
  sortMode: "updated" as SortMode,
});
// Produces: focus, setFocus, sidebarIndex, setSidebarIndex, listIndex, setListIndex, ...
```

Views with 7 stores: PRs, Dependencies, Pipelines, Releases, Projects, Jira, Slack. Config has no store (stateless layout).

- **useConfig** — reads/writes `~/.config/devhub/config.json` (v2 format: multi-org, pinned repos, tracked packages, refresh interval, local projects, Jira settings, Slack channels). Auto-saves on mutation. Handles v1 → v2 migration. Tokens are **not** stored in config -- see Token Storage below.
- **usePullRequests** — builds a GitHub search query from pinned repos + filter mode, fetches via cursor-paginated GraphQL, polls on configurable interval (default 30s). Client-side filters by selected sidebar repo.
- **usePRDetail** — fetches full PR data (body, files, checks) for the detail panel.
- **useDependencySearch** — searches org repos for package usage with disk caching.
- **useNotifications** — fetches GitHub notifications with unread count.
- **useRepos** — fetches all org repos (for the repo search overlay only).
- **useJiraIssues** — builds JQL from project + filter mode (mine/team/person), fetches open + done issues via Jira REST API, React Query with configurable polling interval.
- **useJiraIssueDetail** — fetches full issue data (description, comments, subtasks) for the detail panel via React Query.
- **useSlackAuth** — resolves Slack token via `getToken("slackToken")`, fetches identity via `auth.test`.
- **useSlackChannels** — fetches Slack channel list for the sidebar.
- **useSlackMessages** — fetches message history for selected channel with polling.
- **useSlackMutations** — write operations: post message, add/remove reaction, delete message, set status/presence.
- **useSlackThread** — fetches thread replies for a selected message.
- **useSlackUsers** — user cache with on-demand lookup for display names and avatars.
- **useSlackPresence** — tracks active/away presence for sidebar users.

PR search query pattern: `is:pr is:open repo:org/repo1 repo:org/repo2 ...` with optional `author:` or `review-requested:` modifiers based on filter mode.

Jira JQL pattern: `project = KEY AND assignee = "accountId" AND statusCategory != Done ORDER BY status ASC, updated DESC` with filter mode variants (mine = current user, team = all, person = selected member).

- **useLocalProcesses** — manages child processes for local projects. Event-driven status tracking (spawn/close/error events), log capture (last 500 lines per process), dependency-aware start (auto-starts deps), cleanup on unmount.

### Token Storage (`src/utils/tokens.ts`)

All authentication tokens are stored in a dedicated `~/.config/devhub/tokens.json` file with `0600` permissions (owner read/write only), **not** in `config.json`. This keeps secrets separate from non-sensitive configuration.

Token keys: `githubToken`, `azureToken`, `jiraToken`, `slackToken`.

API:
- `getToken(key: TokenKey): string` — read a token (returns `""` if not set)
- `setToken(key: TokenKey, value: string): void` — write a token
- `deleteToken(key: TokenKey): void` — remove a token

Token resolution order (GitHub example in `src/index.tsx`):
1. `tokens.json` via `getToken("githubToken")`
2. CLI tool (`gh auth token` / `az account get-access-token`)
3. Environment variable (`GITHUB_TOKEN`)

At startup, `migrateTokensFromConfig()` moves any token fields found in `config.json` to `tokens.json` and strips them from config. The `Config` type no longer contains `githubToken`, `azureToken`, `jiraToken`, or `slackToken`.

### Centralized Config File Access (`src/utils/config-file.ts`)

All modules that need to read `config.json` directly (outside of the React `useConfig` hook) use:
- `readConfigFile(): any` — parse and return `config.json` contents (or `null`)
- `getConfigPath(): string` — returns the full path to `config.json`

This avoids scattered path construction and uses `DEFAULT_CONFIG_DIR` from `constants.ts`.

### Cache Separation

Cache files (`query-cache.json`, `dep-cache.json`, `devhub.log`) are stored in `~/.cache/devhub/` (XDG convention), separate from config in `~/.config/devhub/`. The `CACHE_DIR` constant from `src/constants.ts` provides this path. At startup, `migrateCacheFiles()` (from `src/utils/cache-migration.ts`) moves any cache files found in the old `~/.config/devhub/` location to `~/.cache/devhub/`.

### Logging System (`src/utils/logger.ts`)

In-memory ring buffer (500 entries) with file output to `~/.cache/devhub/devhub.log`.

Levels: `info`, `warn`, `error`. Categories: `auth`, `config`, `cache`, `api`, `jira`, `azure`.

API:
- `logger.info(category, message)`, `logger.warn(...)`, `logger.error(...)`
- `getLogEntries(): LogEntry[]` — read the ring buffer
- `clearLog(): void` — clear the ring buffer
- `subscribe(listener): unsubscribe` / `getSnapshot(): number` — React subscription via `useSyncExternalStore`

The **log overlay** (`src/views/log/log-overlay.tsx`) is registered as a `logs` child route (with `layout: "overlay"`) on all 8 views in `routes.ts`. Global shortcut **L** toggles it from any view. Overlay shortcuts: up/down to scroll, **c** to clear, **L** or **Esc** to close.

### Local Projects Config

Projects are configured in `~/.config/devhub/config.json` under the `localProjects` array. Can be added via the TUI (+) or by editing the config file directly (press **e** in Config tab).

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

Jira settings are stored in `~/.config/devhub/config.json` and can be edited via the Config tab (press 8). Jira uses API token authentication (Basic auth), not OAuth. The Jira API token itself is stored in `tokens.json` (not `config.json`) -- see Token Storage above.

Config fields (in `config.json`):
- **jiraSite** — Jira Cloud site hostname (e.g. `your-org.atlassian.net`)
- **jiraEmail** — email associated with the Jira account
- **jiraProject** — Jira project key (e.g. `PROJ`)
- **jiraAccountId** — current user's Jira account ID (auto-resolved via `/myself` endpoint)
- **jiraStatusOrder** — (optional) array of status names to control display order; defaults to `["In Progress", "Blocked", "In Review", "Ready for Test", "To Do", "Done"]`

Token (in `tokens.json`):
- **jiraToken** — Jira API token (generate at https://id.atlassian.com/manage-profile/security/api-tokens), managed via `getToken("jiraToken")` / `setToken("jiraToken", ...)`

### UI Primitives (`src/ui/`)

Reusable building blocks barrel-exported from `src/ui/index.ts`. Import via `from "../ui/index.ts"` or directly (e.g. `from "../ui/router.ts"`, `from "../ui/focus.ts"`).

#### Core Infrastructure

- **theme.ts** — `getTheme()`, `setTheme()`, `icons` constants. Theme `ui` section includes `panelBorder` (dim border for unfocused panels) and `focusBorder` (accent border for focused panels). All 5 themes define both.
- **router.ts** — `RouterProvider` wraps the app, `useRouter()` provides `{ route, params, baseRoute, matchedPath, navigate, goBack }`. `defineRoutes()` creates the route map from nested path definitions. `RouteRenderer` matches the current route and renders the component. `Outlet` renders the child route in nested layouts; `useOutlet()` returns `{ layout, isOverlay }` for conditional rendering.
- **route-shortcuts.ts** — `ROUTE_SHORTCUTS` object with all keyboard shortcuts grouped by route path, `ROUTE_BAR` with bottom bar action lists per route. `getShortcutRoute(matchedPath)` strips `:param` segments for lookup. Query helpers accept optional `matchedPath`: `getBarShortcuts(route, matchedPath)`, `getHelpShortcuts(route, matchedPath)`, `matchShortcut(input, key, route, matchedPath)`.
- **tabs.ts** — `TABS` array defining tab order: PRs (1) / Jira (2) / Projects (3) / Pipelines (4) / Releases (5) / Deps (6) / Slack (7) / Config (8, always last). Helpers: `getTabViews()`, `getTabNumberKeys()`, `getBaseRoute()`.
- **create-view-store.ts** — `createViewStore(defaults)` factory that creates a Zustand vanilla store with auto-generated `set*` setters for every field in the defaults object. Also exports `useStore` for React consumption.

#### Layout Components (lazygit-style panels)

- **Panel** — bordered section with title-in-border, `focused` prop controls border color (`theme.ui.focusBorder` vs `theme.ui.panelBorder`), optional `count` in bottom border, `merge` prop for shared edges between adjacent panels. Uses box-drawing characters (`╭╮╰╯│─├┤`).
- **FocusProvider / useFocus / useFocusNode** — Focus management context. `FocusProvider` wraps a view, `useFocusNode({ id, order })` registers a focusable region. Three dispatch layers: focus node -> route -> global. `focusNext()`/`focusPrev()` cycle through registered nodes by `order`. `trap(id)`/`release()` locks focus to a single node (for dialogs). `FocusSync` pattern: a small component that syncs `focusedId` back to the Zustand store via `useEffect`.
- **ScrollArea / ScrollBar** — `ScrollArea` pairs visible content with a `ScrollBar` indicator. The caller is responsible for slicing items; `ScrollArea` just renders the scroll bar alongside content. `ScrollBar` shows a proportional thumb (`┃`) on a track (`│`), renders nothing when all items fit.
- **Dialog / DialogLayer** — `Dialog` renders a solid-background modal on top of view content (fills behind the Panel so text does not bleed through). Built on `Panel` with `focused={true}`. `DialogLayer` is a compositor that renders content + an optional centered dialog on top.
- **Sidebar** — Generic sidebar component using `Panel` + `ScrollArea`. Props: `title`, `items: SidebarItem[]`, `selectedIndex`, `focused`, `width`, `height`. Handles viewport centering, selection highlighting (inverse+bold), add actions, and current-item bolding. Replaces 6 view-specific sidebar implementations.
- **SearchList** — Search dialog with fuzzy filter (`fuzzyMatch`/`fuzzyScore` from `utils/fuzzy.ts`) + scrollable selectable list. Built on `Dialog`. Props include `items: SearchListItem[]`, `onSelect`, `onClose`, optional `renderItem` for custom rows. Handles keyboard input internally (type to search, arrows to navigate, Enter to select, Esc to close). Replaces 4 search overlay implementations.
- **DetailPanel** — Tabbed detail view with `Panel` + `ScrollArea`. Props: `tabs: DetailTab[]`, `activeTab`, `lines: ContentLine[]`, `scrollOffset`, `height`, `width`. Renders a tab bar with `TabItem` components, a separator, scrollable content lines, and an optional footer. Replaces PR detail and Jira detail boilerplate.
- **ConfirmDialog** — Confirmation dialog with selectable options. Built on `Dialog`. Props: `title`, `message`, `detail?`, `options: ConfirmOption[]`, `onSelect`, `onCancel`. Default options: No/Yes. Arrow keys navigate, Enter selects, Esc cancels.
- **TableRow / TableHeader** — Fixed-width table rows with flex columns, truncation with ellipsis, and selection highlighting (inverse+bold). `Column` type supports `width` (fixed) or `flex` (fill remaining), `align` (left/right), `color`, `bold`, `dimColor`.

#### Simple Components

- **SelectableListItem** — row with blue background when selected
- **TabItem** — single tab label component
- **useListViewport** — handles viewport windowing for scrollable lists
- **Overlay** — renders content as a floating panel over the main UI
- **StatusBarLayout** — consistent status bar wrapper
- **KeyboardHint** — dim hint text for keyboard shortcuts

### Shortcut System (Route-based)

All keyboard shortcuts are defined in `src/ui/route-shortcuts.ts` as `ROUTE_SHORTCUTS` -- an object keyed by route path. Each route maps key strings to `ShortcutDef` objects:
- `action` -- action name (e.g. `"open"`, `"filterMine"`)
- `key` -- trigger key (character or special: `"tab"`, `"return"`, `"escape"`, `"up"`, `"down"`, etc.)
- `label` -- short label for the bottom bar (optional; only entries with a label appear in the bar)
- `help` -- description for the help overlay

The special `_global` key defines shortcuts active on all routes (quit, help, logs, tab switching).

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

#### Focus-Aware Shortcut Dispatch (`focusHandlers`)

Views with multiple focusable regions (e.g. sidebar + list) pass a `focusHandlers` map to `useRouteShortcuts`. This replaces manual `if (focus === "sidebar")` branching:

```ts
useRouteShortcuts(
  { open: () => openPR(), refresh: () => refetch() },
  {
    focusHandlers: {
      sidebar: { up: () => moveSidebar(-1), down: () => moveSidebar(1) },
      list: { up: () => moveList(-1), down: () => moveList(1) },
    },
  },
);
```

Dispatch order: (1) if the focused node has a handler for the action, call it; (2) if `focusHandlers` is provided and the action is `"left"`/`"right"`, auto-wire to `focusPrev()`/`focusNext()`; (3) fall through to the top-level handlers map.

**When to use `useRouteShortcuts` vs `useInput`:**
- `useRouteShortcuts` -- for discrete action shortcuts (open, close, navigate, filter). This is the default for all views and sub-views.
- `useInput` -- only for free-text input modes (search typing, comment typing) and as a `TextInput` companion (e.g. Escape to close an overlay). Overlays with only discrete keys (like `MemberSelect`, `SortOverlay`) should use `useRouteShortcuts`, not `useInput`.
- `useTextInput` (`src/hooks/use-text-input.ts`) -- reusable hook for character-by-character text capture. Provides `query`, `setQuery`, `clear`, and `handleInput(input, key)` that handles backspace and printable chars. Also exports a pure `handleTextInput()` function for testing.

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
