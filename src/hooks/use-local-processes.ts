import { useState, useCallback, useEffect, useRef } from "react";
import { spawn, type ChildProcess } from "child_process";
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

export type ProcessStatus = "stopped" | "starting" | "running" | "error";

export interface ProcessState {
  status: ProcessStatus;
  pid?: number;
  exitCode?: number | null;
  startedAt?: number;
  logs: string[];
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
      for (const dep of cmd.dependencies) {
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

      let hasRunning = false;
      let hasError = false;
      let hasStarting = false;

      for (const cmd of project.commands) {
        const key = processKey(projectName, cmd.name);
        const state = states[key];
        if (state?.status === "running") hasRunning = true;
        if (state?.status === "error") hasError = true;
        if (state?.status === "starting") hasStarting = true;
      }

      if (hasRunning) return "running";
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
          if (
            cmd.dependencies.includes(projectName) ||
            cmd.dependencies.some((d) => d.startsWith(`${projectName}:`))
          ) {
            dependents.add(p.name);
          }
        }
      }
      return [...dependents];
    },
    [projects],
  );

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
