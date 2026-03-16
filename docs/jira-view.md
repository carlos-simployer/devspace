# Jira View — Implementation Plan

> **Status: Implemented.** This document was the original plan. The implementation now uses the route-based system (`src/ui/route-shortcuts.ts`, `src/hooks/use-route-shortcuts.ts`) instead of the `view-config.ts` / `shortcut-registry.ts` files referenced below, which have been deleted.

## Overview

Add a Jira issues view (Tab 6) that shows issues for a configured project, grouped by status like the PR view groups by time period. Supports filtering by assignee (my issues, team, selected people). Issue detail panel on Enter, open in browser on `o`.

**Tab order:** PRs (1) → Deps (2) → Pipelines (3) → Releases (4) → Projects (5) → Jira (6) → Config (7, always last)

---

## Jira Cloud Details

- **Site:** `simployer.atlassian.net`
- **Cloud ID:** `41ab475a-00a0-4c7f-8090-2849bc95e3c5`
- **Project:** `UUX` (configurable)
- **User account ID:** `6231c5aa3fbb88006840a173` (carlos.roberto.gomez.jr@simployer.com)

### Workflow Statuses (UUX project)

| Display Order | Status Name | Status ID | Category | Color |
|---|---|---|---|---|
| 1 | In Progress | 3 | indeterminate | yellow |
| 2 | Blocked | TBD | indeterminate | red |
| 3 | In Review | 10105 | indeterminate | yellow |
| 4 | Ready for Test | TBD | indeterminate | yellow |
| 5 | To Do | 10001 | new | blue-gray |
| 6 | Done | 10002 | done | green |

**Note:** "Blocked" and "Ready for Test" had 0 issues at time of writing (status IDs will be captured at runtime). Status order and names are configurable per project via `jiraStatusOrder` in config.

### Issue Types

- Epic (id: 6, hierarchyLevel: 1)
- Story (id: 7, hierarchyLevel: 0)
- Task (id: 3, hierarchyLevel: 0)
- Sub-task (id: 5, hierarchyLevel: -1)
- Bug (id: 1, hierarchyLevel: 0)

### Team Members (UUX)

- Carlos Roberto Gomez Jr (`6231c5aa3fbb88006840a173`)
- Sebastian Kreft (`5fc649e6f8b0120069e4fe01`)
- Kamila Wozniak (`61811dcf892c420072d8d054`)
- Ariel Cicero (`712020:0de9b84f-f724-48a4-8a83-3cbc53d572b2`)
- Olivier Graziano (`712020:a7f0567d-8ab6-4944-aeb1-0b1fad94a643`)
- Ola Juliussen (`621cd9dc9c3cce006949ecce`)

---

## Auth

**Jira Cloud API token** — simplest approach, no OAuth or admin consent needed.

1. User generates token at https://id.atlassian.com/manage-profile/security/api-tokens
2. Store in config: `jiraEmail` + `jiraToken`
3. API calls use Basic auth: `Authorization: Basic base64(email:token)`
4. Base URL: `https://simployer.atlassian.net/rest/api/3/`

Config view gets a "Jira" section to enter email, token, site, and project key.

---

## API

### Search Issues (main list)

```
GET /rest/api/3/search?jql={jql}&fields=summary,status,issuetype,priority,assignee,created,updated,labels&maxResults=100
Authorization: Basic base64(email:token)
```

JQL examples:
- All open: `project = UUX AND statusCategory != Done ORDER BY status ASC, updated DESC`
- My issues: `project = UUX AND assignee = currentUser() ORDER BY status ASC, updated DESC`
- Specific person: `project = UUX AND assignee = "accountId" ORDER BY status ASC, updated DESC`
- With Done (limit 20): Fetch separately: `project = UUX AND status = Done ORDER BY updated DESC` with `maxResults=20`

### Issue Detail

```
GET /rest/api/3/issue/{issueKey}?fields=summary,description,status,issuetype,priority,assignee,reporter,created,updated,labels,comment,subtasks,parent,fixVersions
```

### Browse URL

```
https://simployer.atlassian.net/browse/{issueKey}
```

---

## View Design

### Layout (follows PR list pattern)

No sidebar — single list view with status group headers (like PR time buckets).

```
┌──────────────────────────────────────────────────────────────┐
│ 1 PRs  2 Deps  3 Pipelines  4 Releases  5 Projects  [6 Jira]  7 Config │
│ m: Mine  t: Team  u: Person  /: Search  R: Refresh  ?: Help │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ▶ In Progress (4)                                            │
│   UUX-1629  Task  Manage app appearance settings             │
│ > UUX-1351  Task  Implement new Colleague Hub v2.0           │
│   UUX-1378  Story Track Navigation events in App...          │
│   UUX-1643  Task  Evaluate UI Library Strategy...            │
│                                                              │
│ ▶ In Review (2)                                              │
│   UUX-1524  Task  Improve translation workflow...            │
│   UUX-1617  Task  Display employee contact list              │
│                                                              │
│ ▶ To Do (12)                                                 │
│   UUX-1790  Bug   Datepicker clipped on mobile               │
│   UUX-1621  Task  Search employees in contacts...            │
│   ...                                                        │
│                                                              │
│ ▶ Done (20)                            ── last 20 shown ──  │
│   UUX-1412  Task  Split hrm-dashboard-widgets...             │
│   ...                                                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Filter: Mine │ UUX │ 19 issues │ Refreshed 5s ago            │
│ UUX-1629 │ Kamila Wozniak │ Medium │ MobileApp                │
└──────────────────────────────────────────────────────────────┘
```

### Row Columns

```
Key (UUX-1629)  │  Type icon  │  Summary (truncated)  │  Assignee  │  Priority  │  Updated
```

### Status Group Headers

Each status group shows as a header row (like PR time buckets):
- Colored icon matching status category (yellow=in progress, green=done, blue=todo)
- Status name + count in parentheses
- Done section limited to 20, shows "(last 20)" hint

### Status Group Order (configurable)

Default: `["In Progress", "Blocked", "In Review", "Ready for Test", "To Do", "Done"]`

Stored in config as `jiraStatusOrder: string[]`. Issues with statuses not in the list appear at the end.

### Filter Modes

| Key | Mode | JQL Filter |
|---|---|---|
| `m` | My issues | `assignee = currentUser()` |
| `t` | Team (all) | No assignee filter |
| `u` | Select person | Overlay to pick team member |

### Issue Detail Panel (Enter)

Full-screen overlay (follows PR detail pattern):

**Tabs:**
- **Overview** — Key, summary, status, type, priority, assignee, reporter, created, updated, labels, description (rendered markdown)
- **Comments** — List of comments with author, date, body
- **Subtasks** — List of child issues with status

**Shortcuts in detail:**
- `Esc` — close
- `o` — open in browser
- `d`/`c`/`s` — switch tabs (details/comments/subtasks)
- `↑/↓` — scroll

---

## Implementation — New Files

### Auth & API
| File | Description |
|---|---|
| `src/api/jira-client.ts` | Fetch wrapper: `searchIssues(jql, fields, maxResults)`, `getIssue(key)`, `getProjectMembers()` |

### Types
| File | Changes |
|---|---|
| `src/api/types.ts` | Add `JiraIssue`, `JiraStatus`, `JiraUser`, `JiraComment` interfaces. Add Jira config fields. |

### Hooks
| File | Description |
|---|---|
| `src/hooks/use-jira-issues.ts` | React Query: fetches open issues + Done (limit 20), groups by status, supports filter mode |
| `src/hooks/use-jira-issue-detail.ts` | React Query: single issue with description, comments, subtasks |

### Utils
| File | Description |
|---|---|
| `src/utils/jira-status.ts` | `groupByStatus(issues, statusOrder)` — groups issues into status buckets (like `groupByTimeBucket`), `getStatusIcon(category)`, `getIssueTypeIcon(type)`, `getPriorityIcon(priority)` |

### View
| File | Description |
|---|---|
| `src/views/jira/index.tsx` | JiraView — main component, useShortcuts, filter state |
| `src/views/jira/issue-list.tsx` | Issue list with status group headers (follows `pr-list.tsx` bucket pattern) |
| `src/views/jira/issue-row.tsx` | Single issue row |
| `src/views/jira/issue-detail/index.tsx` | Full-screen detail panel with tabs |
| `src/views/jira/issue-detail/overview-tab.tsx` | Issue metadata + description |
| `src/views/jira/issue-detail/comments-tab.tsx` | Comment list |
| `src/views/jira/issue-detail/subtasks-tab.tsx` | Child issues |
| `src/views/jira/member-select.tsx` | Team member selection overlay |
| `src/views/jira/status-bar.tsx` | Filter, project, count, selected issue info |

### Modified Files
| File | Changes |
|---|---|
| `src/api/types.ts` | Jira interfaces, extend Config with Jira fields |
| `src/hooks/use-config.ts` | Add jira fields + setters |
| `src/ui/view-config.ts` | Add `"jira"` to `BaseView`, add ViewId entries (`jira`, `jira.help`, `jira.detail`, `jira.search`, `jira.memberSelect`), add tab "6 Jira", bump Config to "7 Config" |
| `src/ui/shortcut-registry.ts` | Add all Jira shortcuts (view: `"jira"`, `"jira.detail"`, etc.) |
| `src/app.tsx` | Add JiraView rendering block, pass config props |
| `src/views/config/index.tsx` | Add Jira section (site, email, token, project) |

---

## Config Fields

```typescript
// Added to Config interface
jiraSite: string;          // e.g. "simployer.atlassian.net"
jiraEmail: string;         // e.g. "carlos.roberto.gomez.jr@simployer.com"
jiraToken: string;         // API token (stored in config, not in code)
jiraProject: string;       // e.g. "UUX"
jiraStatusOrder: string[]; // e.g. ["In Progress", "In Review", "To Do", "Done"]
jiraAccountId: string;     // for "my issues" filter, resolved on first auth
```

---

## Shortcut Registry Entries

```typescript
// src/ui/shortcut-registry.ts — add these entries

// Jira main view
{ action: "open", key: "o", view: "jira", label: "Open", help: "Open issue in browser" },
{ action: "detail", key: "return", view: "jira", label: "Detail", help: "Open issue detail" },
{ action: "filterMine", key: "m", view: "jira", label: "Mine", help: "Filter: my issues" },
{ action: "filterTeam", key: "t", view: "jira", label: "Team", help: "Filter: all team" },
{ action: "filterPerson", key: "u", view: "jira", label: "Person", help: "Filter: select person" },
{ action: "search", key: "/", view: "jira", help: "Search/filter issues" },
{ action: "refresh", key: "R", view: "jira", label: "Refresh", help: "Force refresh" },
{ action: "up", key: "up", view: "jira", help: "Navigate up" },
{ action: "down", key: "down", view: "jira", help: "Navigate down" },
{ action: "clearSearch", key: "escape", view: "jira", help: "Clear search / close" },

// Jira detail
{ action: "close", key: "escape", view: "jira.detail", label: "Close", help: "Close detail" },
{ action: "open", key: "o", view: "jira.detail", label: "Open", help: "Open in browser" },
{ action: "overviewTab", key: "d", view: "jira.detail", help: "Details tab" },
{ action: "commentsTab", key: "c", view: "jira.detail", help: "Comments tab" },
{ action: "subtasksTab", key: "s", view: "jira.detail", help: "Subtasks tab" },
{ action: "up", key: "up", view: "jira.detail", help: "Scroll up" },
{ action: "down", key: "down", view: "jira.detail", help: "Scroll down" },

// Jira member select
{ action: "close", key: "escape", view: "jira.memberSelect", help: "Cancel" },
{ action: "select", key: "return", view: "jira.memberSelect", help: "Select member" },
{ action: "up", key: "up", view: "jira.memberSelect", help: "Navigate up" },
{ action: "down", key: "down", view: "jira.memberSelect", help: "Navigate down" },
```

## View Config Entries

```typescript
// src/ui/view-config.ts — add these entries

// In BaseView type: add "jira"
// In ViewId type: add "jira", "jira.help", "jira.detail", "jira.search", "jira.memberSelect"

// In VIEW_CONFIG:
jira: {
  tab: "6 Jira",
  bar: ["open", "detail", "filterMine", "filterTeam", "filterPerson", "search", "refresh", "help"],
},
"jira.detail": {
  bar: ["close", "open", "overviewTab", "commentsTab", "subtasksTab"],
},
"jira.help": { bar: [] },
"jira.search": { bar: [] },
"jira.memberSelect": { bar: [] },

// Update existing:
config: {
  tab: "7 Config",  // bumped from 6 to 7
  ...
},
```

---

## Implementation Order

1. **Types & Config** — Jira interfaces, config fields, view-config + shortcut-registry entries
2. **Auth & API** — `jira-client.ts` with Basic auth
3. **Data hooks** — `use-jira-issues.ts`, `use-jira-issue-detail.ts` (React Query)
4. **Status utils** — `jira-status.ts` with grouping + icons
5. **Issue list view** — `index.tsx`, `issue-list.tsx`, `issue-row.tsx`, `status-bar.tsx`
6. **Detail panel** — `issue-detail/` with tabs
7. **Filtering** — Filter modes + member select overlay
8. **Wiring** — `app.tsx`, config view Jira section

Each step produces a working app. Steps 5-7 can be parallelized.

---

## Verification

1. `npm run typecheck` — no errors
2. `npm test` — all tests pass
3. Manual: `npm run dev`
   - Tab 6 shows Jira view
   - Without config: shows "Jira not configured. Press 7 to open Config."
   - Config (7): enter site, email, token, project
   - Issues grouped by status in correct order
   - `m` filters to my issues, `t` shows all
   - Enter opens detail with description, comments, subtasks
   - `o` opens `https://simployer.atlassian.net/browse/UUX-1629`
   - Done section shows max 20 issues
