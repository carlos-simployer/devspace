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
```

Pre-commit hook (husky + lint-staged) runs `prettier --write` and `eslint --fix` on staged `.ts`/`.tsx` files.

## Architecture

Full-screen terminal app using **React 18 + Ink 5** (React renderer for CLIs) with **fullscreen-ink** for alternate screen buffer. Data comes from **GitHub GraphQL API** via `@octokit/graphql`.

### Entry & Auth Flow

`src/index.tsx` resolves auth (`gh auth token` → `GITHUB_TOKEN` env → exit), creates a single GraphQL client, parses `--org` arg (or `GITHUB_ORG` env), then renders the app in fullscreen mode via `withFullScreen()`.

### State & Data

All state lives in `src/app.tsx` using React hooks. No external state management.

- **useConfig** — reads/writes `~/.config/github-pr-dash/config.json` (org name + pinned repo list). Auto-saves on mutation.
- **usePullRequests** — builds a GitHub search query from pinned repos + filter mode, fetches via cursor-paginated GraphQL, polls every 30s. Client-side filters by selected sidebar repo.
- **useRepos** — fetches all org repos (for the repo search overlay only).

PR search query pattern: `is:pr is:open repo:org/repo1 repo:org/repo2 ...` with optional `author:` or `review-requested:` modifiers based on filter mode.

### UI Layout

Two-pane layout with keyboard-driven navigation (Ink's `useInput` hook):

- **Sidebar** — pinned repos with "All repos" filter at top, "[+] Add repo" at bottom
- **PR List** — viewport-windowed scrollable list; each row shows repo, PR#, title, author, review icon, CI icon, relative time
- **Status Bar** — active filter, PR count, last refresh
- **Overlays** — help (`?`) and repo search (`+`) rendered over the main UI

Focus toggles between sidebar and list with ←/→ arrows. `useInput` in `app.tsx` is the central keyboard router — overlays capture input when visible.

### Status Mapping

`src/utils/status.ts` maps `reviewDecision` and `statusCheckRollup.state` from the GraphQL response to icons and colors (✓/✗/◌/●/—).

## Code Conventions

- ESM throughout (`"type": "module"` in package.json)
- TypeScript strict mode; `.ts` extensions in imports (e.g., `./api/client.ts`)
- JSX uses `react-jsx` transform (no `React` import needed in components, but present in some files)
- `@typescript-eslint/no-explicit-any` is disabled — `any` is allowed for GraphQL response typing
- Unused variables prefixed with `_` are permitted
- Prettier: double quotes, semicolons, trailing commas, 80-char width
- Volta pins Node 20.20.0 / npm 10.8.2
