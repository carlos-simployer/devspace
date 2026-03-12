# Implementation Summary — GitHub PR Dashboard Feature Expansion

## What was implemented

All 8 phases from the plan were completed. The app compiles, lints, and builds cleanly.

## New Files (7)

| File | Purpose |
|------|---------|
| `src/api/mutations.ts` | GraphQL mutations: `ADD_PR_REVIEW` (approve/request-changes) and `ADD_PR_COMMENT` |
| `src/utils/clipboard.ts` | Platform-aware clipboard via `execSync` — `pbcopy` (macOS), `xclip` (Linux), `clip` (Windows) |
| `src/utils/markdown.ts` | Wraps `marked` + `marked-terminal` to render PR descriptions as formatted terminal output (headings, code blocks, links, tables, etc.) |
| `src/hooks/use-pr-detail.ts` | Fetches `PR_DETAIL_QUERY` by node ID — returns body, comments count, checks breakdown, reviews |
| `src/hooks/use-notifications.ts` | REST API polling (`GET /notifications?participating=true`) every 60s, filtered to PR notifications |
| `src/components/pr-detail.tsx` | Fullscreen scrollable overlay: title, meta, labels, diff stats, rendered markdown description, checks list, reviewer states. Keys: `Esc` close, `o` open in browser, `↑/↓` scroll |
| `src/components/notifications-view.tsx` | Fullscreen overlay listing unread PR notifications: repo, title, reason, time. Keys: `Esc` close, `Enter/o` open in browser, `↑/↓` navigate |

## Modified Files (14)

### Types & API

- **`src/api/types.ts`** — Added to `PullRequest`: `labels.nodes[]{name,color}`, `mergeable`, `additions`, `deletions`, `changedFiles`, `repository.owner.login`. Replaced `Config` with V2 multi-org format (`version`, `orgs[]`, `activeOrg`, qualified `repos[]`, `lastViewed{}`). Added `ConfigV1` (for migration), `SortMode`, `PendingAction` types.
- **`src/api/queries.ts`** — Extended `PR_QUERY` with new fields (labels, mergeable, additions, deletions, changedFiles, owner.login). Added `PR_DETAIL_QUERY` (body, comments, statusCheckRollup.contexts, reviews).

### Hooks

- **`src/hooks/use-config.ts`** — V1→V2 migration (detects missing `version` field, converts `{org, repos}` → `{version:2, orgs:[org], activeOrg, repos:["org/repo"], lastViewed:{}}`). New mutations: `addOrg(org)`, `setActiveOrg(org)`, `markViewed(prId)`. Repos stored as qualified `"org/repo"` strings. Prunes `lastViewed` entries older than 30 days on write.
- **`src/hooks/use-pull-requests.ts`** — Removed `org` parameter (repos are already qualified). Accepts `sortMode` parameter with 3 strategies: `"repo-updated"` (group by repo, then newest), `"updated"` (global newest first), `"oldest"` (global oldest first). Client-side filter uses `owner.login + "/" + name`.

### Components

- **`src/components/sidebar.tsx`** — Accepts `allPRs` and `multiOrg` props. Shows PR count per repo (`repo-name (3)`). Displays `org/repo` format only when multiple orgs exist.
- **`src/components/repo-search.tsx`** — Two modes via `Tab`: repo list (default, scoped to `activeOrg`) and org picker (shows known orgs + `[+] Add organization` with text input). Starts in org picker mode when no org is configured. Repos shown with qualified names for pinning.
- **`src/components/pr-row.tsx`** — New merge conflict column (`Mg`) between CI and Age. Activity indicator: shows cyan `●` in selector area when PR updated since `lastViewed`.
- **`src/components/pr-list.tsx`** — Added `Mg` column header. Passes `lastViewed` to each `PRRow` for activity detection.
- **`src/components/status-bar.tsx`** — Line 1: sort mode indicator, transient status message, comment input display. Line 2: diff stats (`+N -M (K files)`), merge conflict warning, reviewers. Line 3 (conditional): labels with approximate color mapping from hex.
- **`src/components/help-overlay.tsx`** — Added all new keybindings (25 total, up from 15).

### Orchestration

- **`src/index.tsx`** — Passes `token` as prop to `App` (needed for REST notification API).
- **`src/app.tsx`** — All new state wired: `sortMode`, `showDetail`, `showNotifications`, `pendingApprove`, `statusMessage`, `commentMode/commentText/commentType`. Dynamic `statusBarHeight` (3 base + 1 if labels). Renders new overlays (detail, notifications). All keybindings connected. `markViewed(pr.id)` called when opening/viewing a PR.

### Utils

- **`src/utils/columns.ts`** — Added `merge: 3` to `COL`, updated `getTitleWidth`.
- **`src/utils/status.ts`** — Added `getMergeableStatus(pr)`: `CONFLICTING` → `!` red, `UNKNOWN` → `?` gray, `MERGEABLE` → ` `.

## Dependencies Added

- `marked` + `marked-terminal` — Markdown rendering in PR detail panel (headings, code blocks, syntax highlighting, clickable links via OSC 8, tables, emoji)

## Keybinding Map (Final)

| Key | Action | Context |
|-----|--------|---------|
| `Enter/p` | Open PR detail panel | list focus |
| `o` | Open PR in browser | list focus |
| `y` | Copy PR URL | list focus |
| `Y` | Copy branch name | list focus |
| `S` | Cycle sort mode | global |
| `A` | Approve PR (press twice to confirm) | list focus |
| `C` | Add comment (type + Enter) | list focus |
| `X` | Request changes (type + Enter) | list focus |
| `n` | Toggle notifications | global |
| `Tab` | Switch org / repos mode | repo search overlay |

All existing keybindings unchanged (`↑/↓`, `←/→`, `r`, `a`, `m`, `s`, `t`, `c`, `+`, `d`, `R`, `/`, `Esc`, `?`, `q`).

## Deviations from Plan

- **Enter in list focus** opens detail panel (not browser) — `o` remains open in browser. This was an intentional change from the original behavior per the keybinding map.
- **Repo search** starts in org picker mode when `activeOrg` is empty, so first-time users without `--org` are guided to add an org first.
- **PR description** rendered via `marked` + `marked-terminal` instead of raw text truncated to 15 lines — full markdown with syntax highlighting and clickable hyperlinks.
- **PendingAction type** simplified in app.tsx — approve uses a dedicated `pendingApprove` state instead of the generic `PendingAction` interface, since comment/request-changes flow differently (they enter comment input mode directly).
