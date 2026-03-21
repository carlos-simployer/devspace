# Tab Key Focus Cycling

## Status: Planned

## Summary

Remap Tab to cycle focus between panels (sidebar/list) instead of switching view tabs. Number keys 1-8 already handle view switching, making Tab/Shift+Tab redundant.

## Current behavior

- `Tab` → next view tab (PRs → Jira → Projects → ...)
- `Shift+Tab` → previous view tab
- `←/→` → cycle pane focus (sidebar ↔ list)
- `1-8` → jump to specific view tab

## Proposed behavior

- `Tab` → focus next pane (sidebar → list)
- `Shift+Tab` → focus previous pane (list → sidebar)
- `1-8` → switch view tabs (unchanged)
- `←/→` → also cycle panes (keep as secondary binding)

## Implementation

1. Remove `tab` → `nextView` and `shift+tab` → `prevView` from `_global` shortcuts in `src/ui/route-shortcuts.ts`
2. In `src/hooks/use-route-shortcuts.ts`, when Tab is pressed and `focusHandlers` is provided, call `focusNext()`; Shift+Tab calls `focusPrev()`
3. Number keys 1-8 remain the way to switch views

## Edge cases

- **Single-pane views** (Jira, Config): Tab is a no-op (only one focus node) or falls through to no action
- **Overlay/dialog active**: Tab should not cycle panes when focus is trapped in a dialog
- **Help/log overlay**: Tab behavior during overlays needs consideration
