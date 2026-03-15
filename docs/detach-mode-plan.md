# Plan: File-based Logs + Detach Mode for Projects

## Context
Projects view currently captures stdout/stderr in-memory only (max 500 lines). Logs are lost on quit. The user wants:
1. **Persistent logs** — process output saved to disk, visible across sessions
2. **Detach mode** — toggle to keep processes running on quit, reconnect on next launch

## Approach

### Key design: child writes directly to log file, parent tails it

```
Child process → writes stdout/stderr to → ~/.config/devspace/logs/project-name.log
                                              ↑
Parent (LogTailer) → reads new lines from ──┘ → in-memory logs[] → UI
```

This naturally supports detach mode — the child keeps writing to the file after the parent exits. On reconnect, the parent reads the file and resumes tailing.

### Phase 1: File-based logs (3 new files + 1 modified)

**New: `src/utils/log-file.ts`**
- `getLogPath(name)` → `~/.config/devspace/logs/<name>.log`
- `openLogFile(name)` → opens/overwrites, returns fd (child inherits this)
- `truncateLogFile(name)` → truncates to 0 bytes (for "clear logs")
- `readTailLines(name, n)` → reads last N lines (for reconnect)
- `enforceMaxSize(path)` → truncates beginning if >2MB

**New: `src/utils/log-tailer.ts`**
- EventEmitter class that watches a log file
- `fs.watch` + 500ms poll fallback
- Reads new bytes from tracked offset, emits `"lines"` event
- Handles file truncation (offset reset)

**Modify: `src/hooks/use-local-processes.ts`**
- Spawn with `stdio: ["ignore", logFd, logFd]` (child writes to file)
- Create LogTailer per process for live display
- `appendLog` fed by tailer events instead of pipe events
- `clearLogs` also calls `truncateLogFile`
- Store tailers in `tailersRef`, stop on unmount

**Trade-off:** We lose stderr coloring (both streams go to same fd). Acceptable for persistence benefits.

### Phase 2: Detach mode (1 new file + 6 modified)

**New: `src/utils/pid-registry.ts`**
- `running-projects.json` — saves `{ name, pid, startedAt, logFile }` per process
- `registerProcess()` / `unregisterProcess()` / `getAliveDetachedProcesses()`
- `isProcessAlive(pid)` — `process.kill(pid, 0)` check

**Modify: `src/hooks/use-local-processes.ts`**
- New status: `"detached"` for reconnected processes
- On mount: check pid-registry, reconnect alive processes, tail their log files
- On exit: if `keepProjectsRunning`, save PIDs to registry instead of killing
- Module-level `detachOnExit` flag checked by the exit handler
- `stop()` for detached: `process.kill(pid, "SIGTERM")` directly (no ChildProcess ref)
- `start()` collision detection: if PID alive, reconnect instead of re-spawn

**Modify: `src/api/types.ts`**
- Add `keepProjectsRunning: boolean` to Config

**Modify: `src/hooks/use-config.ts`**
- Default `keepProjectsRunning: false`, add `setKeepProjectsRunning` callback

**Modify: `src/views/projects/project-list.tsx`**
- Add "detached" status icon/color

**Modify: `src/views/config/index.tsx`**
- Add "Keep Projects Running" toggle in Cache/settings section

**Modify: `src/app.tsx`**
- Pass `keepProjectsRunning` + setter to ProjectsView

## Files

### New (3 + 2 test files)
- `src/utils/log-file.ts`
- `src/utils/log-tailer.ts`
- `src/utils/pid-registry.ts`
- `src/utils/log-file.test.ts`
- `src/utils/pid-registry.test.ts`

### Modified (7)
- `src/hooks/use-local-processes.ts` — core changes
- `src/api/types.ts` — Config + ProcessStatus
- `src/hooks/use-config.ts` — new config field
- `src/app.tsx` — pass new props
- `src/views/projects/index.tsx` — accept keepProjectsRunning
- `src/views/projects/project-list.tsx` — detached status display
- `src/views/config/index.tsx` — detach mode toggle

## Verification

1. Start a project → check `~/.config/devspace/logs/` for log file
2. Quit app → verify log file persists with output
3. Restart app → log panel shows previous output
4. Enable "Keep Projects Running" in Config
5. Start project, quit → verify process still alive (`ps aux | grep`)
6. Restart app → project shows as "detached" with logs
7. Kill detached project from UI → verify process dies
8. Clear logs → verify file truncated, new output continues
9. Run `npm run typecheck && npm test`
