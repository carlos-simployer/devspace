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
│   ├── jira-client.ts           # Jira Cloud REST API client (Basic auth, search, issue detail, myself)
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
│   ├── jira/                    # Jira issue tracker view
│   │   ├── index.tsx            # JiraView — issue list, filter, search, member select
│   │   ├── issue-list.tsx       # Issue list grouped by status
│   │   ├── issue-row.tsx        # Single issue row
│   │   ├── status-bar.tsx       # Jira status bar (filter mode, project, counts)
│   │   ├── member-select.tsx    # Team member select overlay
│   │   └── issue-detail/        # Issue detail panel (sub-view)
│   │       ├── index.tsx        # Tab switching (overview/comments/subtasks) + scroll
│   │       ├── overview-tab.tsx # Issue metadata, description, status
│   │       ├── comments-tab.tsx # Issue comments
│   │       └── subtasks-tab.tsx # Subtask list
│   └── config/                  # Configuration view
│       └── index.tsx            # Org management, refresh interval, Jira settings, edit config
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
│   └── jira-status.ts           # Jira status grouping, icons, colors (type/priority)
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
- **JiraView** (`views/jira/index.tsx`) — Jira Cloud issue tracker with filter modes (mine/team/person), status-grouped issue list, issue detail panel (overview/comments/subtasks tabs), team member select overlay
- **ConfigView** (`views/config/index.tsx`) — org management, refresh interval, theme, Azure DevOps settings, Jira settings, open config in VS Code (e)

Views use `useShortcuts` from `src/hooks/use-shortcuts.ts` instead of raw `useInput`. This hook reads the current `ViewId` from `ViewContext`, matches keyboard input against the shortcut registry, and dispatches to action handlers. Global shortcuts (quit, help toggle, tab switching via Tab/Shift+Tab/1-7) are handled automatically.

Sub-view navigation uses `setView` from the context (e.g., `setView("prs.detail")`, `setView("jira.detail")`, `setView("jira.memberSelect")`). Views derive boolean state from the current ViewId (e.g., `showHelp = view === "jira.help"`).

### State & Data

No external state management. Each view manages its own state via React hooks.

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
- **shortcut-registry.ts** — single source of truth for all keyboard shortcuts (see Shortcut System below)
- **view-config.ts** — `ViewId` type (includes sub-views like `"prs.detail"`, `"jira.detail"`, `"jira.memberSelect"`), `BaseView` type, `VIEW_CONFIG` with tab labels and bar action lists, plus helpers: `getBaseView()`, `getTabViews()`, `getTabNumberKeys()`. Tab order: PRs (1) / Deps (2) / Pipelines (3) / Releases (4) / Projects (5) / Jira (6) / Config (7, always last)
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

`src/utils/jira-status.ts` groups Jira issues by status name, maps status categories (`new`/`indeterminate`/`done`) to theme colors, and provides icons for issue types (bug, story, epic, task, sub-task) and priority levels.

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
