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
│   ├── selectable-list-item.tsx # Blue-bg selected row component
│   ├── use-list-viewport.ts     # Viewport windowing hook for scrollable lists
│   ├── overlay.tsx              # Overlay wrapper component
│   ├── status-bar-layout.tsx    # Status bar wrapper
│   └── keyboard-hint.tsx        # Dim hint text component
├── views/                       # View modules (each owns its state + input handling)
│   ├── prs/                     # PR dashboard view
│   │   ├── index.tsx            # PRView — owns all PR state and useInput
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
│   ├── projects/                # Local projects runner view
│   │   ├── index.tsx            # ProjectsView — process start/stop, log panel
│   │   ├── project-list.tsx     # Project list with status indicators
│   │   ├── log-panel.tsx        # Live log detail panel (right side)
│   │   └── add-project.tsx      # Multi-step add project wizard
│   └── config/                  # Configuration view
│       └── index.tsx            # Org management, refresh interval, edit config
├── components/                  # Shared cross-view components
│   ├── help-overlay.tsx         # Keyboard shortcut help overlay
│   ├── tab-bar.tsx              # View switcher tab bar (1-6)
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
│   ├── use-global-keys.ts       # handleGlobalKeys() shared across views
│   └── use-local-processes.ts   # Child process management for local projects
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
├── app.tsx                      # Thin shell: config, view switching (prs/deps/config)
├── index.tsx                    # Entry point: auth, client, alt-screen, render
└── patched-stdout.ts            # Buffered stdout to avoid fullscreen flicker
```

### Entry & Auth Flow

`src/index.tsx` resolves auth (`gh auth token` → `GITHUB_TOKEN` env → exit), creates a single GraphQL client, parses `--org` arg (or `GITHUB_ORG` env), enters alternate screen buffer, then renders `<App>`.

### View Architecture

`src/app.tsx` is a thin shell that manages view switching between six views and provides shared state (config, repos, notifications, dependency data) to each view.

Each view in `src/views/` is self-contained:
- **PRView** (`views/prs/index.tsx`) — owns all PR-specific state, input handling, and sub-components (sidebar, list, detail panel, overlays)
- **DependencyTracker** (`views/dependencies/index.tsx`) — owns dependency search state and layout
- **PipelinesView** (`views/pipelines/index.tsx`) — Azure DevOps pipeline monitoring
- **ReleasesView** (`views/releases/index.tsx`) — Azure DevOps release tracking
- **ProjectsView** (`views/projects/index.tsx`) — local dev project runner with process management, log panel, dependency-aware start/stop
- **ConfigView** (`views/config/index.tsx`) — org management, refresh interval, theme, Azure DevOps settings, open config in VS Code (e)

Views call `handleGlobalKeys()` from `src/hooks/use-global-keys.ts` inside their `useInput` handlers to share global key bindings (q, Tab, 1-6, ?).

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
- **SelectableListItem** — row with blue background when selected
- **useListViewport** — handles viewport windowing for scrollable lists
- **Overlay** — renders content as a floating panel over the main UI
- **StatusBarLayout** — consistent status bar wrapper
- **KeyboardHint** — dim hint text for keyboard shortcuts

Import these via `from "../ui/index.ts"` or `from "../ui/theme.ts"`.

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
- Tests co-located with source files as `*.test.ts` in `src/utils/`
- View components organized by feature: `views/<name>/index.tsx` as entry point
- Shared UI primitives go in `src/ui/`, shared cross-view components go in `src/components/`
- Pure functions go in `src/utils/` with corresponding test files
