# TUI Router System — Implementation Plan

## Architecture: Three Separate Files

### 1. `src/ui/routes.ts` — Navigation only
Route definitions with component, layout, and params.

### 2. `src/ui/route-shortcuts.ts` — All shortcuts grouped by route
All shortcuts grouped by route path for easy scanning.

### 3. `src/ui/tabs.ts` — Tab order and display
Numbers auto-derived from position. Config always last.

## See full plan at docs/router-plan.md or .claude/plans/
