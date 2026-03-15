import { createContext, useContext } from "react";
import type { ProcessState } from "../../hooks/use-local-processes.ts";

export interface ProjectsContextValue {
  selectedIndex: number;
  setSelectedIndex: (v: number | ((prev: number) => number)) => void;
  states: Record<string, ProcessState>;
  start: (name: string) => void;
  stop: (name: string) => void;
  restart: (name: string) => void;
  clearLogs: (name: string) => void;
  getDependents: (name: string) => string[];
}

export const ProjectsContext = createContext<ProjectsContextValue>(null!);

export function useProjectsContext(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (ctx === null) {
    throw new Error(
      "useProjectsContext must be used within ProjectsContext.Provider",
    );
  }
  return ctx;
}
