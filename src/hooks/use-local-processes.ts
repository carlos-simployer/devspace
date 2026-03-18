import { useState, useCallback, useEffect, useRef } from "react";
import { spawn, type ChildProcess } from "child_process";
import pidusage from "pidusage";
import pidtree from "pidtree";
import type { LocalProject } from "../api/types.ts";

// Module-level registry so processes can be killed on exit
const allChildren = new Set<ChildProcess>();

function killAllChildren() {
  for (const child of allChildren) {
    try {
      if (child.pid) {
        process.kill(-child.pid, "SIGTERM");
      } else {
        child.kill("SIGTERM");
      }
    } catch {
      try {
        child.kill("SIGTERM");
      } catch {
        // already dead
      }
    }
  }
  allChildren.clear();
}

process.on("exit", killAllChildren);

export type ProcessStatus =
  | "stopped"
  | "starting"
  | "running"
  | "partial"
  | "error";

export interface ProcessState {
  status: ProcessStatus;
  pid?: number;
  exitCode?: number | null;
  startedAt?: number;
  memoryMB?: number;
  cpuPercent?: number;
  logs: string[];
}

interface ProcessStats {
  memoryMB?: number;
  cpuPercent?: number;
}

/**
 * Fetch CPU (%) and memory (MB) for process trees rooted at the given pids.
 * Uses pidtree to discover all children, then pidusage for stats.
 * Returns aggregated stats per leader pid (sum of entire tree).
 * Cross-platform: works on macOS, Linux, and Windows.
 */
async function getAllProcessStats(
  leaderPids: number[],
): Promise<Map<number, ProcessStats>> {
  const result = new Map<number, ProcessStats>();
  if (leaderPids.length === 0) return result;

  try {
    // Collect all pids in each tree, mapped back to their leader
    const allPids: number[] = [];
    const pidToLeader = new Map<number, number>();

    for (const leader of leaderPids) {
      try {
        const tree = await pidtree(leader, { root: true });
        for (const pid of tree) {
          allPids.push(pid);
          pidToLeader.set(pid, leader);
        }
      } catch {
        // Process may have exited — include leader only as fallback
        allPids.push(leader);
        pidToLeader.set(leader, leader);
      }
    }

    if (allPids.length === 0) return result;

    // Single pidusage call for all pids across all trees
    const stats = await pidusage(allPids);

    // Aggregate by leader
    for (const [pidStr, info] of Object.entries(stats)) {
      const pid = parseInt(pidStr, 10);
      if (!info || !pid) continue;
      const leader = pidToLeader.get(pid);
      if (leader === undefined) continue;

      const existing = result.get(leader) ?? {
        memoryMB: 0,
        cpuPercent: 0,
      };
      existing.memoryMB =
        Math.round(
          ((existing.memoryMB ?? 0) + info.memory / (1024 * 1024)) * 10,
        ) / 10;
      existing.cpuPercent =
        Math.round(((existing.cpuPercent ?? 0) + info.cpu) * 10) / 10;
      result.set(leader, existing);
    }

    // Clean up zero values
    for (const [pid, stats] of result) {
      if (!stats.memoryMB) stats.memoryMB = undefined;
      if (!stats.cpuPercent) stats.cpuPercent = undefined;
    }
  } catch {
    // Process may have exited between check and query
  }

  return result;
}

/** Composite key for a project command: "projectName:commandName" */
export function processKey(projectName: string, commandName: string): string {
  return `${projectName}:${commandName}`;
}

const MAX_LOG_LINES = 500;

export function useLocalProcesses(projects: LocalProject[]) {
  const [states, setStates] = useState<Record<string, ProcessState>>({});
  const procsRef = useRef<Record<string, ChildProcess>>({});

  // Initialize state for new projects/commands
  useEffect(() => {
    setStates((prev) => {
      const next = { ...prev };
      const validKeys = new Set<string>();

      for (const p of projects) {
        for (const cmd of p.commands) {
          const key = processKey(p.name, cmd.name);
          validKeys.add(key);
          if (!next[key]) {
            next[key] = { status: "stopped", logs: [] };
          }
        }
      }

      // Remove state for deleted projects/commands
      for (const key of Object.keys(next)) {
        if (!validKeys.has(key)) {
          delete next[key];
        }
      }
      return next;
    });
  }, [projects]);

  const appendLog = useCallback((key: string, line: string) => {
    setStates((prev) => {
      const ps = prev[key];
      if (!ps) return prev;
      const logs = [...ps.logs, line];
      if (logs.length > MAX_LOG_LINES) {
        logs.splice(0, logs.length - MAX_LOG_LINES);
      }
      return { ...prev, [key]: { ...ps, logs } };
    });
  }, []);

  const startOne = useCallback(
    (projectName: string, commandName: string) => {
      const project = projects.find((p) => p.name === projectName);
      if (!project) return;
      const cmd = project.commands.find((c) => c.name === commandName);
      if (!cmd) return;

      const key = processKey(projectName, commandName);

      // Already running
      if (procsRef.current[key]) return;

      setStates((prev) => ({
        ...prev,
        [key]: { status: "starting", logs: prev[key]?.logs ?? [] },
      }));

      const cwd = cmd.cwd || project.path;
      const child = spawn(cmd.command, {
        cwd,
        shell: true,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });

      procsRef.current[key] = child;
      allChildren.add(child);

      child.stdout?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          appendLog(key, line);
        }
      });

      child.stderr?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          appendLog(key, `[stderr] ${line}`);
        }
      });

      child.on("spawn", () => {
        setStates((prev) => ({
          ...prev,
          [key]: {
            ...prev[key]!,
            status: "running",
            pid: child.pid,
            startedAt: Date.now(),
          },
        }));
      });

      child.on("error", (err) => {
        appendLog(key, `[error] ${err.message}`);
        setStates((prev) => ({
          ...prev,
          [key]: { ...prev[key]!, status: "error" },
        }));
        delete procsRef.current[key];
        allChildren.delete(child);
      });

      child.on("close", (code) => {
        appendLog(key, `[exit] Process exited with code ${code}`);
        setStates((prev) => ({
          ...prev,
          [key]: {
            ...prev[key]!,
            status: code === 0 ? "stopped" : "error",
            exitCode: code,
            pid: undefined,
            startedAt: undefined,
          },
        }));
        delete procsRef.current[key];
        allChildren.delete(child);
      });
    },
    [projects, appendLog],
  );

  /** Start a command, resolving its dependencies first. */
  const startCommand = useCallback(
    (projectName: string, commandName: string) => {
      const project = projects.find((p) => p.name === projectName);
      if (!project) return;
      const cmd = project.commands.find((c) => c.name === commandName);
      if (!cmd) return;

      // Start dependencies first (use procsRef to check if already running)
      for (const dep of cmd.dependencies ?? []) {
        if (dep.includes(":")) {
          const [depProj, depCmd] = dep.split(":");
          const depKey = processKey(depProj!, depCmd!);
          if (!procsRef.current[depKey]) {
            startOne(depProj!, depCmd!);
          }
        } else {
          const depProject = projects.find((p) => p.name === dep);
          if (depProject) {
            for (const dc of depProject.commands) {
              const depKey = processKey(dep, dc.name);
              if (!procsRef.current[depKey]) {
                startOne(dep, dc.name);
              }
            }
          }
        }
      }

      startOne(projectName, commandName);
    },
    [projects, startOne],
  );

  /** Start all commands of a project. */
  const startAll = useCallback(
    (projectName: string) => {
      const project = projects.find((p) => p.name === projectName);
      if (!project) return;
      for (const cmd of project.commands) {
        startCommand(projectName, cmd.name);
      }
    },
    [projects, startCommand],
  );

  const stopOne = useCallback((projectName: string, commandName: string) => {
    const key = processKey(projectName, commandName);
    const child = procsRef.current[key];
    if (!child || !child.pid) return;

    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }

    const pid = child.pid;
    setTimeout(() => {
      try {
        process.kill(-pid, 0);
        process.kill(-pid, "SIGKILL");
      } catch {
        // already dead
      }
    }, 3000);
  }, []);

  /** Stop all commands of a project. */
  const stopAll = useCallback(
    (projectName: string) => {
      const project = projects.find((p) => p.name === projectName);
      if (!project) return;
      for (const cmd of project.commands) {
        stopOne(projectName, cmd.name);
      }
    },
    [projects, stopOne],
  );

  const restartCommand = useCallback(
    (projectName: string, commandName: string) => {
      const key = processKey(projectName, commandName);
      const child = procsRef.current[key];
      if (child) {
        child.on("close", () => {
          setTimeout(() => startCommand(projectName, commandName), 300);
        });
        stopOne(projectName, commandName);
      } else {
        startCommand(projectName, commandName);
      }
    },
    [startCommand, stopOne],
  );

  const clearLogs = useCallback((projectName: string, commandName: string) => {
    const key = processKey(projectName, commandName);
    setStates((prev) => {
      const ps = prev[key];
      if (!ps) return prev;
      return { ...prev, [key]: { ...ps, logs: [] } };
    });
  }, []);

  /** Get aggregate status for a project across all its commands. */
  const getProjectStatus = useCallback(
    (projectName: string): ProcessStatus => {
      const project = projects.find((p) => p.name === projectName);
      if (!project) return "stopped";

      let runningCount = 0;
      let hasError = false;
      let hasStarting = false;
      const totalCommands = project.commands.length;

      for (const cmd of project.commands) {
        const key = processKey(projectName, cmd.name);
        const state = states[key];
        if (state?.status === "running") runningCount++;
        if (state?.status === "error") hasError = true;
        if (state?.status === "starting") hasStarting = true;
      }

      if (runningCount === totalCommands) return "running";
      if (runningCount > 0) return "partial";
      if (hasStarting) return "starting";
      if (hasError) return "error";
      return "stopped";
    },
    [projects, states],
  );

  /** Get project names that depend on the given project. */
  const getDependents = useCallback(
    (projectName: string): string[] => {
      const dependents = new Set<string>();
      for (const p of projects) {
        for (const cmd of p.commands) {
          const deps = cmd.dependencies ?? [];
          if (
            deps.includes(projectName) ||
            deps.some((d) => d.startsWith(`${projectName}:`))
          ) {
            dependents.add(p.name);
          }
        }
      }
      return [...dependents];
    },
    [projects],
  );

  // Poll memory + CPU usage for running processes every 5s (single async ps call)
  useEffect(() => {
    const timer = setInterval(() => {
      const procs = procsRef.current;
      const entries = Object.entries(procs);
      if (entries.length === 0) return;

      // Collect all pids for a single ps call
      const keyByPid = new Map<number, string>();
      const pids: number[] = [];
      for (const [key, child] of entries) {
        if (child?.pid) {
          keyByPid.set(child.pid, key);
          pids.push(child.pid);
        }
      }

      if (pids.length === 0) return;

      getAllProcessStats(pids).then((statsMap) => {
        setStates((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [pid, stats] of statsMap) {
            const key = keyByPid.get(pid);
            if (
              key &&
              next[key] &&
              (next[key].memoryMB !== stats.memoryMB ||
                next[key].cpuPercent !== stats.cpuPercent)
            ) {
              next[key] = {
                ...next[key],
                memoryMB: stats.memoryMB,
                cpuPercent: stats.cpuPercent,
              };
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup all processes on unmount
  useEffect(() => {
    return () => {
      for (const child of Object.values(procsRef.current)) {
        try {
          if (child.pid) {
            process.kill(-child.pid, "SIGTERM");
          } else {
            child.kill("SIGTERM");
          }
        } catch {
          try {
            child.kill("SIGTERM");
          } catch {
            // already dead
          }
        }
      }
      procsRef.current = {};
    };
  }, []);

  return {
    states,
    startCommand,
    startAll,
    stopOne,
    stopAll,
    restartCommand,
    clearLogs,
    getProjectStatus,
    getDependents,
  };
}
