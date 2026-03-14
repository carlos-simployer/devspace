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

Full-screen terminal app using **React 18 + Ink 5** (React renderer for CLIs). Data comes from **GitHub GraphQL API** via `@octokit/graphql`. Tests use **vitest**.

### Directory Structure

```
src/
├── api/                         # GraphQL client, queries, mutations, types
│   ├── client.ts                # Creates authenticated GraphQL client
│   ├── queries.ts               # PR search + detail queries
│   ├── dependency-queries.ts    # Dependency search queries
│   ├── mutations.ts             # PR review/comment mutations
│   └── types.ts                 # All shared TypeScript interfaces
├── ui/                          # Reusable UI primitives (barrel-exported via index.ts)
│   ├── index.ts                 # Barrel export for all ui/ modules
│   ├── theme.ts                 # Centralized color + icon constants
│   ├── shortcut-registry.ts     # Single source of truth for all keyboard shortcuts
│   ├── shortcut-registry.test.ts # Tests for shortcut registry
│   ├── view-config.ts           # ViewId type system, view definitions, tab/bar config
│   ├── view-context.ts          # React context for current view + setView navigation
│   ├── selectable-list-item.tsx # Blue-bg selected row component
│   ├── tab-item.tsx             # Single tab label component
│   ├── use-list-viewport.ts     # Viewport windowing hook for scrollable lists
│   ├── overlay.tsx              # Overlay wrapper component
│   ├── status-bar-layout.tsx    # Status bar wrapper
│   └── keyboard-hint.tsx        # Dim hint text component
├── views/                       # View modules (each owns its state + shortcuts)
│   ├── prs/                     # PR dashboard view
│   │   ├── index.tsx            # PRView — owns all PR state and useShortcuts
│   │   ├── sidebar.tsx          # Pinned repos sidebar
│   │   ├── pr-list.tsx          # Scrollable PR list
│   │   ├── pr-row.tsx           # Single PR row
│   │   ├── status-bar.tsx       # Filter, count, refresh timer
│   │   ├── repo-search.tsx      # Repo search overlay
│   │   ├── notifications-view.tsx # GitHub notifications panel
│   │   └── pr-detail/           # PR detail panel (sub-view)
│   │       ├── index.tsx        # Tab switching + scroll
│   │       ├── overview-tab.tsx # PR metadata, description, checks
│   │       ├── files-tab.tsx    # Changed file list + expansion
│   │       └── diff-view.tsx    # Patch line rendering
│   ├── dependencies/            # Dependency tracker view
│   │   ├── index.tsx            # DependencyTracker component
│   │   ├── package-list.tsx     # Tracked packages sidebar
│   │   ├── package-search.tsx   # Package name search overlay
│   │   ├── dep-results.tsx      # Repos using a tracked package
│   │   └── dep-status-bar.tsx   # Dep view status bar
│   ├── pipelines/               # Azure DevOps pipelines view
│   │   ├── index.tsx            # PipelinesView — pipeline monitoring
│   │   ├── pipeline-sidebar.tsx # Pinned pipelines sidebar
│   │   ├── pipeline-list.tsx    # Pipeline build list
│   │   ├── pipeline-row.tsx     # Single pipeline row
│   │   ├── pipeline-runs.tsx    # Pipeline runs detail panel
│   │   ├── pipeline-search.tsx  # Pipeline search overlay
│   │   └── status-bar.tsx       # Pipeline status bar
│   ├── releases/                # Azure DevOps releases view
│   │   ├── index.tsx            # ReleasesView — release tracking
│   │   ├── definition-sidebar.tsx # Release definitions sidebar
│   │   ├── definition-search.tsx  # Definition search overlay
│   │   ├── release-list.tsx     # Release list
│   │   ├── release-row.tsx      # Single release row
│   │   └── status-bar.tsx       # Release status bar
│   ├── projects/                # Local projects runner view
│   │   ├── index.tsx            # ProjectsView — process start/stop, log panel
│   │   ├── project-list.tsx     # Project list with status indicators
│   │   ├── log-panel.tsx        # Live log detail panel (right side)
│   │   └── add-project.tsx      # Multi-step add project wizard
│   └── config/                  # Configuration view
│       └── index.tsx            # Org management, refresh interval, edit config
├── components/                  # Shared cross-view components
│   ├── view-header.tsx          # Shared header (TabBar + Shortcuts bar)
│   ├── help-overlay.tsx         # Keyboard shortcut help overlay (reads from registry)
│   ├── tab-bar.tsx              # View switcher tab bar (reads from view-config)
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
│   ├── use-shortcuts.ts         # Shortcut hook (replaces useInput in views)
│   ├── use-global-keys.ts       # handleGlobalKeys() (legacy, being replaced by useShortcuts)
│   ├── use-local-processes.ts   # Child process management for local projects
│   ├── use-pipelines.ts         # Azure DevOps pipeline data
│   ├── use-pipeline-runs.ts     # Pipeline run history
│   ├── use-releases.ts          # Azure DevOps release data
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
│   └── fuzzy.ts                 # Fuzzy match/score for search
├── app.tsx                      # ViewContext.Provider + ViewHeader, view switching
├── index.tsx                    # Entry point: auth, client, alt-screen, render
└── patched-stdout.ts            # Buffered stdout to avoid fullscreen flicker
```

### Entry & Auth Flow

`src/index.tsx` resolves auth (`gh auth token` → `GITHUB_TOKEN` env → exit), creates a single GraphQL client, parses `--org` arg (or `GITHUB_ORG` env), enters alternate screen buffer, then renders `<App>`.

### View Architecture

`src/app.tsx` wraps views in a `ViewContext.Provider` and renders a shared `ViewHeader` component (TabBar + Shortcuts bar). View switching and sub-view navigation use the `ViewId` type from `src/ui/view-config.ts`.

Each view in `src/views/` is self-contained:
- **PRView** (`views/prs/index.tsx`) — owns all PR-specific state, input handling, and sub-components (sidebar, list, detail panel, overlays)
- **DependencyTracker** (`views/dependencies/index.tsx`) — owns dependency search state and layout
- **PipelinesView** (`views/pipelines/index.tsx`) — Azure DevOps pipeline monitoring
- **ReleasesView** (`views/releases/index.tsx`) — Azure DevOps release tracking
- **ProjectsView** (`views/projects/index.tsx`) — local dev project runner with process management, log panel, dependency-aware start/stop
- **ConfigView** (`views/config/index.tsx`) — org management, refresh interval, theme, Azure DevOps settings, open config in VS Code (e)

Views use `useShortcuts` from `src/hooks/use-shortcuts.ts` instead of raw `useInput`. This hook reads the current `ViewId` from `ViewContext`, matches keyboard input against the shortcut registry, and dispatches to action handlers. Global shortcuts (quit, help toggle, tab switching via Tab/Shift+Tab/1-6) are handled automatically.

Sub-view navigation uses `setView` from the context (e.g., `setView("prs.detail")`, `setView("prs.help")`). Views derive boolean state from the current ViewId (e.g., `showHelp = view === "prs.help"`).

### State & Data

No external state management. Each view manages its own state via React hooks.

- **useConfig** — reads/writes `~/.config/github-pr-dash/config.json` (v2 format: multi-org, pinned repos, tracked packages, refresh interval, local projects). Auto-saves on mutation. Handles v1 → v2 migration.
- **usePullRequests** — builds a GitHub search query from pinned repos + filter mode, fetches via cursor-paginated GraphQL, polls on configurable interval (default 30s). Client-side filters by selected sidebar repo.
- **usePRDetail** — fetches full PR data (body, files, checks) for the detail panel.
- **useDependencySearch** — searches org repos for package usage with disk caching.
- **useNotifications** — fetches GitHub notifications with unread count.
- **useRepos** — fetches all org repos (for the repo search overlay only).

PR search query pattern: `is:pr is:open repo:org/repo1 repo:org/repo2 ...` with optional `author:` or `review-requested:` modifiers based on filter mode.

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

### UI Primitives (`src/ui/`)

Reusable building blocks barrel-exported from `src/ui/index.ts`:
- **theme.ts** — `colors` and `icons` constants used throughout the app
- **shortcut-registry.ts** — single source of truth for all keyboard shortcuts (see Shortcut System below)
- **view-config.ts** — `ViewId` type (includes sub-views like `"prs.detail"`, `"prs.help"`), `BaseView` type, `VIEW_CONFIG` with tab labels and bar action lists, plus helpers: `getBaseView()`, `getTabViews()`, `getTabNumberKeys()`
- **view-context.ts** — React context providing `{ view, setView, baseView }` to the component tree; consumed via `useView()` hook
- **SelectableListItem** — row with blue background when selected
- **TabItem** — single tab label component
- **useListViewport** — handles viewport windowing for scrollable lists
- **Overlay** — renders content as a floating panel over the main UI
- **StatusBarLayout** — consistent status bar wrapper
- **KeyboardHint** — dim hint text for keyboard shortcuts

Import these via `from "../ui/index.ts"` or `from "../ui/theme.ts"`.

### Shortcut System

All keyboard shortcuts are defined once in `src/ui/shortcut-registry.ts` as a flat `SHORTCUTS` array. Each entry has:
- `action` — action name (e.g. `"open"`, `"filterMine"`)
- `key` — trigger key (character or special: `"tab"`, `"return"`, `"escape"`, `"up"`, `"down"`, etc.)
- `view` — `ViewId` this shortcut is active in; `undefined` = global (always active)
- `label` — short label for the bottom bar (optional; only entries with a label appear in the bar)
- `help` — description for the help overlay

Query helpers derive UI from the registry:
- `getBarShortcuts(viewId)` — returns `[{key, label}]` for the bottom bar, filtered by `VIEW_CONFIG[viewId].bar` action names
- `getHelpShortcuts(viewId)` — returns `[key, help]` pairs for the help overlay (view-specific + globals)
- `matchShortcut(input, key, viewId)` — matches Ink's `useInput` args against the registry; view-specific shortcuts take precedence over globals

**Adding a new shortcut:** Add one entry to the `SHORTCUTS` array in `shortcut-registry.ts`, then add a handler for that action name in the view's `useShortcuts` call. If it should appear in the bottom bar, also add its action name to `VIEW_CONFIG[viewId].bar` in `view-config.ts`.

### Status Mapping

`src/utils/status.ts` maps `reviewDecision` and `statusCheckRollup.state` from the GraphQL response to icons and colors defined in `src/ui/theme.ts`.

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
