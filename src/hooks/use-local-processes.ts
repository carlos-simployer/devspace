import { useState, useCallback, useEffect, useRef } from "react";
import { spawn, type ChildProcess } from "child_process";
import type { LocalProject } from "../api/types.ts";

// Module-level registry so processes can be killed on exit
const allChildren = new Set<ChildProcess>();

function killAllChildren() {
  for (const child of allChildren) {
    try {
      process.kill(-child.pid!, "SIGTERM");
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

const MAX_LOG_LINES = 500;

export function useLocalProcesses(projects: LocalProject[]) {
  const [states, setStates] = useState<Record<string, ProcessState>>({});
  const procsRef = useRef<Record<string, ChildProcess>>({});

  // Initialize state for new projects
  useEffect(() => {
    setStates((prev) => {
      const next = { ...prev };
      for (const p of projects) {
        if (!next[p.name]) {
          next[p.name] = { status: "stopped", logs: [] };
        }
      }
      // Remove state for deleted projects
      for (const name of Object.keys(next)) {
        if (!projects.some((p) => p.name === name)) {
          delete next[name];
        }
      }
      return next;
    });
  }, [projects]);

  const appendLog = useCallback((name: string, line: string) => {
    setStates((prev) => {
      const ps = prev[name];
      if (!ps) return prev;
      const logs = [...ps.logs, line];
      if (logs.length > MAX_LOG_LINES) {
        logs.splice(0, logs.length - MAX_LOG_LINES);
      }
      return { ...prev, [name]: { ...ps, logs } };
    });
  }, []);

  const startOne = useCallback(
    (name: string) => {
      const project = projects.find((p) => p.name === name);
      if (!project) return;

      // Already running
      if (procsRef.current[name]) return;

      setStates((prev) => ({
        ...prev,
        [name]: { status: "starting", logs: prev[name]?.logs ?? [] },
      }));

      const child = spawn(project.command, {
        cwd: project.path,
        shell: true,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });

      procsRef.current[name] = child;
      allChildren.add(child);

      child.stdout?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          appendLog(name, line);
        }
      });

      child.stderr?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          appendLog(name, `[stderr] ${line}`);
        }
      });

      // Mark as running once the process has spawned
      child.on("spawn", () => {
        setStates((prev) => ({
          ...prev,
          [name]: {
            ...prev[name]!,
            status: "running",
            pid: child.pid,
            startedAt: Date.now(),
          },
        }));
      });

      child.on("error", (err) => {
        appendLog(name, `[error] ${err.message}`);
        setStates((prev) => ({
          ...prev,
          [name]: { ...prev[name]!, status: "error" },
        }));
        delete procsRef.current[name];
        allChildren.delete(child);
      });

      child.on("close", (code) => {
        appendLog(name, `[exit] Process exited with code ${code}`);
        setStates((prev) => ({
          ...prev,
          [name]: {
            ...prev[name]!,
            status: code === 0 ? "stopped" : "error",
            exitCode: code,
            pid: undefined,
            startedAt: undefined,
          },
        }));
        delete procsRef.current[name];
        allChildren.delete(child);
      });
    },
    [projects, appendLog],
  );

  const start = useCallback(
    (name: string) => {
      const project = projects.find((p) => p.name === name);
      if (!project) return;

      // Start dependencies first
      for (const dep of project.dependencies) {
        const depState = states[dep];
        if (depState && depState.status !== "running") {
          start(dep);
        }
      }

      startOne(name);
    },
    [projects, states, startOne],
  );

  const stop = useCallback((name: string) => {
    const child = procsRef.current[name];
    if (!child || !child.pid) return;

    // Kill process group (shell + children)
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }

    // Force kill if still alive after 3s
    const pid = child.pid;
    setTimeout(() => {
      try {
        process.kill(-pid, 0); // check if still alive
        process.kill(-pid, "SIGKILL");
      } catch {
        // already dead
      }
    }, 3000);
  }, []);

  const restart = useCallback(
    (name: string) => {
      const child = procsRef.current[name];
      if (child) {
        // Listen for close, then restart
        child.on("close", () => {
          // Small delay to allow cleanup
          setTimeout(() => start(name), 300);
        });
        stop(name);
      } else {
        start(name);
      }
    },
    [start, stop],
  );

  const clearLogs = useCallback((name: string) => {
    setStates((prev) => {
      const ps = prev[name];
      if (!ps) return prev;
      return { ...prev, [name]: { ...ps, logs: [] } };
    });
  }, []);

  const getDependents = useCallback(
    (name: string): string[] => {
      return projects
        .filter((p) => p.dependencies.includes(name))
        .map((p) => p.name);
    },
    [projects],
  );

  // Cleanup all processes on unmount
  useEffect(() => {
    return () => {
      for (const child of Object.values(procsRef.current)) {
        try {
          process.kill(-child.pid!, "SIGTERM");
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
    start,
    stop,
    restart,
    clearLogs,
    getDependents,
  };
}
