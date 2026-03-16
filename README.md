# devspace

A full-screen terminal dashboard for developer workflows — GitHub PRs, Jira issues, Azure DevOps pipelines, local projects, and more. Built with React and [Ink](https://github.com/vadimdemedes/ink).

## Features

- **PR Dashboard** -- live-updating list of open PRs across pinned repos with review status, CI status, and time grouping
- **PR Detail Panel** -- view PR description, checks, changed files, and diffs without leaving the terminal
- **PR Actions** -- approve, comment, or request changes directly from the dashboard
- **Dependency Tracker** -- search which repos use a specific npm package and at what version
- **Notifications** -- view GitHub notifications inline
- **Multi-Org** -- configure and switch between multiple GitHub organizations
- **Keyboard-Driven** -- every action has a keybinding; no mouse needed

## Setup

### Prerequisites

- Node.js 20+ (pinned via Volta: 20.20.0)
- GitHub CLI (`gh`) authenticated, **or** a `GITHUB_TOKEN` environment variable

### Install

```bash
npm install
```

### Authentication

The app resolves a GitHub token in this order:

1. `gh auth token` (from GitHub CLI)
2. `GITHUB_TOKEN` environment variable
3. Exits with an error if neither is found

## Usage

```bash
# Run in development mode
npm run dev

# Specify an organization
npm run dev -- --org my-org

# Or use an environment variable
GITHUB_ORG=my-org npm run dev
```

On first launch, the app opens the config view to add your organization. After that, use `+` to pin repos to the sidebar.

### Keyboard Shortcuts

#### Global

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Cycle between views |
| `1` / `2` / `3` | Jump to PRs / Dependencies / Config |
| `?` | Toggle help overlay |
| `q` | Quit |

#### PR View

| Key | Action |
|-----|--------|
| `Up` / `Down` | Navigate list |
| `Left` / `Right` | Switch sidebar / list focus |
| `Enter` / `o` | Open PR in browser |
| `p` | Open PR detail panel |
| `r` | Open repo in browser |
| `a` | Open Actions tab in browser |
| `y` | Copy PR URL |
| `Y` | Copy branch name |
| `m` | Filter: my PRs |
| `s` | Filter: review requested |
| `t` | Filter: all PRs |
| `c` | Filter: closed/merged |
| `S` | Cycle sort mode |
| `/` | Search/filter PRs |
| `A` | Approve PR (two-step confirm) |
| `C` | Add comment |
| `X` | Request changes |
| `n` | Toggle notifications |
| `+` | Add repo |
| `d` | Remove selected repo |
| `R` | Force refresh |

#### Dependency View

| Key | Action |
|-----|--------|
| `Up` / `Down` | Navigate list |
| `Left` / `Right` | Switch packages / results |
| `Enter` / `o` | Open package.json in browser |
| `+` | Add package to track |
| `d` / `-` | Remove tracked package |
| `R` | Force refresh |

## Configuration

Config is stored at `~/.config/devspace/config.json` (created automatically).

```json
{
  "version": 2,
  "orgs": ["my-org"],
  "activeOrg": "my-org",
  "repos": ["my-org/repo-a", "my-org/repo-b"],
  "trackedPackages": ["react", "typescript"],
  "refreshInterval": 30
}
```

| Field | Description |
|-------|-------------|
| `orgs` | GitHub organizations to monitor |
| `repos` | Pinned repositories (shown in sidebar) |
| `trackedPackages` | npm packages tracked in the dependency view |
| `refreshInterval` | PR poll interval in seconds (30, 45, 60, or 120) |

The app auto-migrates from the v1 config format (single org) to v2 (multi-org).

## Architecture

```
src/
├── api/          # GraphQL client, queries, mutations, types
├── ui/           # Reusable UI primitives (theme, list viewport, overlay)
├── views/        # Feature views (prs/, dependencies/, config/)
├── components/   # Shared cross-view components (help, tab bar)
├── hooks/        # React hooks (data fetching, config, auth)
├── utils/        # Pure utility functions with unit tests
├── app.tsx       # Thin shell: config + view switching
└── index.tsx     # Entry point: auth, client setup, render
```

Each view in `views/` is self-contained with its own state, input handling, and sub-components. `app.tsx` (~176 lines) acts as a thin orchestrator.

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Development

```bash
npm run dev            # Run with tsx
npm run build          # Compile to dist/
npm run start          # Run compiled build
npm test               # Run unit tests (vitest)
npm run test:watch     # Tests in watch mode
npm run typecheck      # TypeScript strict check
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check
```

Pre-commit hooks (husky + lint-staged) auto-format and lint staged `.ts`/`.tsx` files.

## Tech Stack

- [React 18](https://react.dev/) + [Ink 5](https://github.com/vadimdemedes/ink) -- React renderer for CLIs
- [@octokit/graphql](https://github.com/octokit/graphql.js) -- GitHub GraphQL API client
- [vitest](https://vitest.dev/) -- Unit testing
- [tsup](https://github.com/egoist/tsup) -- Build tool (ESM output)
- [tsx](https://github.com/privatenumber/tsx) -- TypeScript execution for development
