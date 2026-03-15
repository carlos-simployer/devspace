# Feature Ideas

## Calendar & Mail (Planned — blocked on admin consent)

- **Calendar view (Tab 6)** — Week view of Outlook calendar events with day sidebar, event list, week navigation
- **Mail view (Tab 7)** — Recent emails with sender, subject, time, unread indicators
- **Auth:** Azure AD app `github-cli-dashboard` with device code flow
- **Status:** App registered, permissions added, waiting on admin consent
- See [calendar-mail-views.md](./calendar-mail-views.md) for full implementation plan

---

## Slack Integration

- **Unread DMs & mentions** — Mini Slack inbox showing who messaged you with preview text
- **Channel watcher** — Pin channels (e.g. `#deployments`, `#tech-frontend-chapter`) and see recent messages
- **Quick reply** — Type a response without leaving the TUI
- **Auto Slack status from calendar** — Sync meeting name from calendar to Slack status, clear when meeting ends
- **Deploy alerts** — Watch a deployments channel alongside the Pipelines view
- **Auth:** Slack app with user token (`xoxp-`), scopes: `channels:read`, `chat:write`, `users.profile:write`. No admin consent needed.

---

## Tempo Timesheet

- **Log hours from TUI** — Pre-filled from calendar events (meeting was 1.5h? One keystroke to log it)
- **Daily/weekly overview** — See logged vs expected hours
- **Quick log** — Select a Jira issue, enter hours, done
- **Auth:** Tempo API token

---

## CI/CD Enhancements

- **GitHub Actions in Pipelines view** — Show workflow runs for pinned GitHub repos alongside Azure Pipelines. Same columns: status, branch, commit, duration. Data from `GET /repos/{owner}/{repo}/actions/runs` — no new auth needed.
- **Environment dashboard** — What's deployed where (dev/staging/prod) with version, last deploy time, health status
- **Log tail** — Stream logs from Azure App Service or container instances in the TUI

---

## Jira / Azure Boards

- **My tasks** — Assigned work items, sprint board, navigate between columns with keyboard
- **Sprint burndown** — ASCII chart of remaining work in current sprint
- **Quick status update** — Move items between states without leaving the TUI

---

## Unified Notifications Hub

- **Single view aggregating all sources** — GitHub PR reviews needed, pipeline failures, unread emails, Slack mentions, Jira assignments
- Sorted by time, one place to triage everything
- Keystroke to jump to the relevant view for each notification

---

## Developer Tools

- **Multi-repo git status** — Show local branch, dirty state, ahead/behind for cloned repos
- **Quick links / bookmarks** — Configurable URLs opened with a keystroke (Figma, Confluence, Grafana, etc.)
- **DNS/SSL monitor** — Track cert expiry dates for domains, alert when close

---

## Team Awareness

- **Team availability** — Who's OOF today from calendar data
- **Team pulse** — Who's active based on recent commits/PR activity
- **PR review queue** — Dedicated view of PRs waiting on your review across all repos

---

## Time & Productivity

- **Pomodoro timer** — Focus blocks with auto Slack status "Focusing"
- **Weekly summary** — Auto-generated: PRs merged, meetings attended, hours logged, top repos touched
- **Activity heatmap** — GitHub-style contribution grid for all activity (commits, PRs, reviews, deploys)

---

## Local Task Manager

- **Quick capture** — Press `+`, type a task, done. No tickets, no API, no auth.
- **Simple states** — Todo / in-progress / done, cycle with keystroke
- **Priority** — High / normal / low with color coding
- **Due dates** — Optional, highlighted when overdue
- **Stored locally** — `~/.config/devspace/tasks.json`, no sync needed
- **Cross-view integrations:**
  - Auto-create "Review PR #342" task when assigned a review
  - Pin a Jira ticket ID to a task for quick reference/link
  - "Log hours" reminders based on Tempo gaps
- **Layout:** Simple list with filter by state, sort by priority/due date

---

## Config View Redesign -- IMPLEMENTED

Implemented as tool-based sections: one section visible at a time, full width. Left/right to switch sections, up/down to navigate items, Enter to edit. Uses `useRouteShortcuts` for keyboard handling. Section overlays (addOrg, editAzureOrg, etc.) sync to the router via `navigate("config/addOrg")` etc.

---

## Other

- **Dashboard / home view** — Summary screen: unread emails, PRs needing review, next meeting in X min, failing pipelines
- **Desktop notifications** — System alerts for pipeline failures, PR review assignments
- **Changelog generator** — Select date range, pull merged PRs + deploys, generate formatted changelog
