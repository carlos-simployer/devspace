# Calendar & Mail Views — Implementation Plan

> **Status: Not yet implemented.** This plan references `use-global-keys.ts`, `tab-bar`, and `help-overlay` modification patterns from the old view-based system. The app now uses a router-based system (`src/ui/router.ts`, `src/ui/route-shortcuts.ts`, `src/ui/tabs.ts`). New views should add routes in `app.tsx`, shortcuts in `route-shortcuts.ts`, and a tab entry in `tabs.ts`.

## Overview

Add two new views to the TUI dashboard:
- **6 Calendar** — Week view of Outlook calendar events
- **7 Mail** — Recent emails from Outlook inbox

Both use Microsoft Graph API, authenticated via a custom Azure AD app with device code flow.

---

## Azure AD App Registration

- **App name:** `github-cli-dashboard`
- **App (client) ID:** `c51d660c-d377-4414-8e16-dd58168347bc`
- **Tenant ID:** `a95532f4-6c46-4e23-b282-f2c591c0bef7`
- **Publisher domain:** `infotjenester.onmicrosoft.com`
- **Auth flow:** Device code (public client, `isFallbackPublicClient: true`)
- **Sign-in audience:** `AzureADMyOrg`

### Required Permissions (Delegated)

| Permission | ID | Status |
|---|---|---|
| `Calendars.Read` | `465a38f9-76ea-45b9-9f34-9e8b0d4b0b42` | Added, **pending admin consent** |
| `Mail.Read` | `570282fd-fa5c-430d-a7fd-fc8dc98a9dca` | Added, **pending admin consent** |

### Admin Consent URL

```
https://login.microsoftonline.com/a95532f4-6c46-4e23-b282-f2c591c0bef7/adminconsent?client_id=c51d660c-d377-4414-8e16-dd58168347bc
```

To check status: Entra portal → Identity → Applications → App registrations → github-cli-dashboard → API permissions. Green checkmark under Status = approved.

---

## Auth Flow (Device Code)

### First launch (no stored tokens)

1. App POSTs to device code endpoint:
   ```
   POST https://login.microsoftonline.com/a95532f4-6c46-4e23-b282-f2c591c0bef7/oauth2/v2.0/devicecode
   Body: client_id=c51d660c-d377-4414-8e16-dd58168347bc&scope=https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Mail.Read offline_access
   ```
2. Response includes `user_code`, `device_code`, `verification_uri`
3. TUI displays: "Open https://login.microsoft.com/device and enter code XXXXX"
4. App polls token endpoint every 5s:
   ```
   POST https://login.microsoftonline.com/a95532f4-6c46-4e23-b282-f2c591c0bef7/oauth2/v2.0/token
   Body: client_id=c51d660c-d377-4414-8e16-dd58168347bc&grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code={device_code}
   ```
5. Once signed in → receives `access_token` + `refresh_token`
6. Store `refresh_token` in config file

### Subsequent launches

- Use stored `refresh_token` to silently get new `access_token`:
  ```
  POST https://login.microsoftonline.com/a95532f4-6c46-4e23-b282-f2c591c0bef7/oauth2/v2.0/token
  Body: client_id=c51d660c-d377-4414-8e16-dd58168347bc&grant_type=refresh_token&refresh_token={stored_refresh_token}&scope=https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Mail.Read offline_access
  ```
- No user interaction needed (refresh tokens last ~90 days)
- If refresh token expired → fall back to device code flow

---

## API Endpoints

### Calendar

```
GET https://graph.microsoft.com/v1.0/me/calendarView
  ?startDateTime=2026-03-09T00:00:00Z
  &endDateTime=2026-03-15T23:59:59Z
  &$orderby=start/dateTime
  &$top=50
Authorization: Bearer {access_token}
```

Response fields: `subject`, `start.dateTime`, `end.dateTime`, `location.displayName`, `organizer`, `attendees`, `isAllDay`, `isCancelled`, `showAs`, `importance`, `webLink`

### Mail

```
GET https://graph.microsoft.com/v1.0/me/messages
  ?$orderby=receivedDateTime desc
  &$top=25
  &$select=subject,sender,receivedDateTime,isRead,importance,hasAttachments,webLink,bodyPreview
Authorization: Bearer {access_token}
```

Response fields: `subject`, `sender.emailAddress`, `receivedDateTime`, `isRead`, `importance`, `hasAttachments`, `bodyPreview`, `webLink`

---

## View Design

### Calendar View (Tab 6)

Layout follows existing sidebar + list pattern:

- **Sidebar:** Days of the week (Mon–Sun), selected day highlighted
  - Shows event count per day
  - Navigate with ↑/↓
- **Main area:** Events for selected day, sorted chronologically
  - Time range | Subject | Location | Organizer
  - All-day events shown at top
  - Cancelled events shown with strikethrough/dim
  - Color coding by `showAs`: busy (default), tentative (dim), oof (colored)
- **Week navigation:** `[`/`]` to go previous/next week, `t` to jump to today
- **Shortcuts:** `o` open event in browser (Outlook web link)
- **Status bar:** Current week range, event count, refresh status

### Mail View (Tab 7)

Layout: single list (no sidebar needed):

- **List:** Recent emails sorted by date descending
  - Unread indicator (bold/dot) | Sender | Subject | Time ago | Attachment icon
  - Importance indicator for high-priority emails
- **Shortcuts:** `o` open in browser, `R` refresh, `/` search/filter
- **Status bar:** Unread count, total shown, refresh status

---

## Implementation — New Files

### Auth & API
| File | Description |
|---|---|
| `src/api/ms-graph-auth.ts` | Device code flow: initiate, poll, refresh token, store/load from config |
| `src/api/ms-graph-client.ts` | Fetch wrapper for Graph API: `fetchCalendarView()`, `fetchMessages()` |

### Types
| File | Changes |
|---|---|
| `src/api/types.ts` | Add `CalendarEvent`, `MailMessage` interfaces. Extend `AppView` with `"calendar"`, `"mail"`. Add `msGraphRefreshToken` to `Config`. |

### Hooks
| File | Description |
|---|---|
| `src/hooks/use-calendar.ts` | React Query hook: `useCalendarEvents(weekStart, weekEnd)` |
| `src/hooks/use-mail.ts` | React Query hook: `useMailMessages(limit)` |
| `src/hooks/use-ms-graph-auth.ts` | Hook managing device code flow UI state + token lifecycle |

### Calendar View
| File | Description |
|---|---|
| `src/views/calendar/index.tsx` | CalendarView — sidebar + day events + week navigation |
| `src/views/calendar/day-sidebar.tsx` | Week days sidebar with event counts |
| `src/views/calendar/event-list.tsx` | Events for selected day |
| `src/views/calendar/event-row.tsx` | Single event row |
| `src/views/calendar/status-bar.tsx` | Calendar status bar |

### Mail View
| File | Description |
|---|---|
| `src/views/mail/index.tsx` | MailView — email list with filtering |
| `src/views/mail/mail-list.tsx` | Scrollable email list |
| `src/views/mail/mail-row.tsx` | Single email row |
| `src/views/mail/status-bar.tsx` | Mail status bar |

## Implementation — Modified Files

| File | Changes |
|---|---|
| `src/api/types.ts` | New interfaces, extend AppView + Config |
| `src/hooks/use-config.ts` | Add `msGraphRefreshToken` default + setter |
| `src/hooks/use-global-keys.ts` | Add keys `6` → calendar, `7` → mail |
| `src/components/tab-bar.tsx` | Add tabs 6 + 7, hint `Tab/1-7` |
| `src/components/help-overlay.tsx` | Add calendar + mail shortcut lists |
| `src/app.tsx` | Add VIEWS entries, render blocks, auth state |

---

## What's Left (Blocklist)

### Blocked — Requires Admin Action
- [ ] **Admin consent for `github-cli-dashboard` app** — Send admin the consent URL above. Without this, device code flow shows "approval required" screen. Check status in Entra portal → API permissions → Status column.

### Ready to Build (no blockers)
- [ ] `src/api/ms-graph-auth.ts` — Device code flow + token refresh logic
- [ ] `src/api/ms-graph-client.ts` — Graph API fetch wrapper
- [ ] `src/api/types.ts` — CalendarEvent, MailMessage interfaces, AppView extension
- [ ] `src/hooks/use-ms-graph-auth.ts` — Auth state hook
- [ ] `src/hooks/use-calendar.ts` — React Query hook for calendar
- [ ] `src/hooks/use-mail.ts` — React Query hook for mail
- [ ] Calendar view components (5 files)
- [ ] Mail view components (4 files)
- [ ] Modified files: use-config, use-global-keys, tab-bar, help-overlay, app.tsx
- [ ] Help overlay shortcut lists for calendar + mail

### After Implementation
- [ ] Test device code flow end-to-end (requires admin consent first)
- [ ] Verify token refresh works across app restarts
- [ ] Manual testing: week navigation, event display, email list, open in browser
- [ ] `npm run typecheck` / `npm test` / `npm run lint` pass
