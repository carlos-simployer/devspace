# System Info Tab — Plan

## Overview

New Tab 8 showing system information useful for developers. Scrollable, read-only, refreshable with R.

## Sections

### Machine
- OS name + version + arch (`os.platform()`, `os.release()`, `os.arch()`)
- Hostname (`os.hostname()`)
- CPU model + core count (`os.cpus()`)
- RAM total/used with progress bar (`os.totalmem()`, `os.freemem()`)
- Disk total/used/free with progress bar (`statfsSync("/")`)

### Network
- Wi-Fi name (`networksetup -getairportnetwork en0` on macOS)
- Local IP (`os.networkInterfaces()`, filter non-internal IPv4)
- Public IP (`fetch("https://api.ipify.org?format=json")`)
- VPN status (detect `utun`/`tun`/`ppp`/`tap` interfaces with assigned IPs)

### Runtime
- devhub version (from package.json)
- Node.js version (`process.version`)
- npm version (`execSync("npm --version")`)
- Terminal size + program + color support
- App uptime (time since start)
- Process memory usage (`process.memoryUsage()`)

### Auth Status (live checks)
- GitHub: user + auth method (gh CLI / config token / env)
- Azure DevOps: org/project + auth method
- Jira: email + project + auth method
- Each with ✓/✗ indicator

### Active Ports (from Projects view)
- Port, project name, PID, memory usage, uptime
- Memory per child process via `ps -o rss= -p <pid>` on macOS

### Storage
- Config file size + path
- Query cache size + age
- Dep cache size + age

### Environment Variables
- GITHUB_TOKEN: set/not set
- AZURE_DEVOPS_TOKEN: set/not set
- GITHUB_ORG value
- EDITOR value
- TERM + TERM_PROGRAM

## UI

- Scrollable (up/down arrows)
- Progress bars for RAM and disk (themed: green < 70%, yellow 70-90%, red > 90%)
- R to refresh all data
- ? for help

## Implementation

- New route: `system` with `SystemLayout` + `SystemInfoView`
- Tab 8, Config moves to Tab 9 (always last)
- Data gathered via `os` module + `child_process` + `fs.statfsSync`
- Public IP fetched async (with loading/error state)
- Process memory for children read from Projects context or process list

## Mockup

```
devhub  1 PRs  2 Deps  3 Pipelines  4 Releases  5 Projects  6 Jira  7 System  8 Config

  Machine
  OS:       macOS 15.2 (Darwin 24.6.0) arm64
  CPU:      Apple M2 Pro — 12 cores
  RAM:      8.2 GB / 16 GB (51%)  ████████░░░░░░░░
  Disk:     523 GB / 931 GB (56%) █████████░░░░░░░

  Network
  Wi-Fi:    Office-5G (en0)
  Local IP: 192.168.1.42
  Public IP: 203.0.113.42
  VPN:      ✓ Connected (utun3 → 10.8.0.5)

  Runtime
  devhub: 1.0.0 | Node: 20.20.0 | npm: 10.8.2
  Terminal: 180 × 45 (iTerm2, truecolor)
  Uptime:   2h 15m | Memory: 52 MB

  Auth
  GitHub:   ✓ carlos-roberto (gh CLI)
  Azure:    ✓ simployer/UUX (az CLI)
  Jira:     ✓ carlos@simployer.com → UUX

  Ports
  :3000  shell-app-backend    pid:12345  120 MB  ↑1h23m
  :5173  shell-app-frontend   pid:12346   85 MB  ↑1h23m

  Storage
  Config:      2.1 KB
  Query cache: 245 KB (2h old)
  Dep cache:   18 KB (35m old)
```
