# Jira View — Implementation Plan

## Overview

Add a Jira issues view (Tab 6) that shows issues for a configured project, grouped by status like the PR view groups by time period. Supports filtering by assignee (my issues, team, selected people). Issue detail panel on Enter, open in browser on `o`.

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
┌─────────────────────────────────────────────────────┐
│ 1 PRs  2 Deps  3 Pipelines  4 Releases  [5 Jira]  │
│ +: Add project  m: Mine  t: Team  /: Search  ?: Help│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ▶ In Progress (4)                                   │
│   UUX-1629  Task  Manage app appearance settings    │
│ > UUX-1351  Task  Implement new Colleague Hub v2.0  │
│   UUX-1378  Story Track Navigation events in App... │
│   UUX-1643  Task  Evaluate UI Library Strategy...   │
│                                                     │
│ ▶ In Review (2)                                     │
│   UUX-1524  Task  Improve translation workflow...   │
│   UUX-1617  Task  Display employee contact list     │
│                                                     │
│ ▶ To Do (12)                                        │
│   UUX-1790  Bug   Datepicker clipped on mobile      │
│   UUX-1621  Task  Search employees in contacts...   │
│   UUX-1619  Task  Display employee contact details  │
│   ...                                               │
│                                                     │
│ ▶ Done (20)                    ── last 20 shown ──  │
│   UUX-1412  Task  Split hrm-dashboard-widgets...    │
│   UUX-1552  Task  Unique Callback Scheme            │
│   ...                                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Filter: Mine │ UUX │ 19 issues │ Refreshed 5s ago  │
│ UUX-1629 │ Kamila Wozniak │ Medium │ MobileApp     │
└─────────────────────────────────────────────────────┘
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
| `src/api/types.ts` | Add `JiraIssue`, `JiraStatus`, `JiraUser`, `JiraComment` interfaces. Extend `AppView` with `"jira"`. Add Jira config fields. |

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
| `src/views/jira/index.tsx` | JiraView — main component, input handling, filter state |
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
| `src/api/types.ts` | Jira interfaces, extend AppView, extend Config |
| `src/hooks/use-config.ts` | Add jira fields: `jiraSite`, `jiraEmail`, `jiraToken`, `jiraProject`, `jiraStatusOrder`, `jiraAccountId` + setters |
| `src/hooks/use-global-keys.ts` | Add key `6` → `"jira"` (bump config to 7) |
| `src/components/tab-bar.tsx` | Add `{ key: "jira", label: "6 Jira" }`, config becomes 7 |
| `src/components/help-overlay.tsx` | Add jira shortcut list |
| `src/app.tsx` | Add jira to VIEWS, render block, config props |
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

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `↑/↓` | Navigate issues |
| `Enter` | Open issue detail panel |
| `o` | Open issue in browser |
| `m` | Filter: my issues |
| `t` | Filter: team (all) |
| `u` | Filter: select person |
| `/` | Search/filter issues by text |
| `R` | Force refresh |
| `Tab/1-7` | Switch view |
| `Esc` | Clear search / close overlay |
| `?` | Toggle help |
| `q` | Quit |

---

## Implementation Order

1. **Auth & API** — `jira-client.ts`, types, config fields
2. **Data hooks** — `use-jira-issues.ts`, `use-jira-issue-detail.ts`
3. **Status utils** — `jira-status.ts` with grouping + icons
4. **Issue list view** — `index.tsx`, `issue-list.tsx`, `issue-row.tsx`, `status-bar.tsx`
5. **Detail panel** — `issue-detail/` with tabs
6. **Filtering** — Filter modes + member select overlay
7. **Wiring** — app.tsx, tab-bar, global-keys, help-overlay, config view
8. **Config section** — Jira settings in config view (site, email, token, project)

Each step produces a working app. Steps 4-6 can be parallelized.

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
