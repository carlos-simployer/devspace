import { createContext, useContext } from "react";
import type {
  ProcessState,
  ProcessStatus,
} from "../../hooks/use-local-processes.ts";

export type ProjectFocus = "sidebar" | "commands";

export interface ConfirmActionDef {
  type: "startAll" | "killAll" | "killProject" | "removeProject";
  projectName?: string;
  label: string;
  detail?: string;
}

export interface ProjectsContextValue {
  selectedIndex: number;
  setSelectedIndex: (v: number | ((prev: number) => number)) => void;
  selectedCommandIndex: number;
  setSelectedCommandIndex: (v: number | ((prev: number) => number)) => void;
  focus: ProjectFocus;
  setFocus: (v: ProjectFocus) => void;
  states: Record<string, ProcessState>;
  startCommand: (projectName: string, commandName: string) => void;
  startAll: (projectName: string) => void;
  stopOne: (projectName: string, commandName: string) => void;
  stopAll: (projectName: string) => void;
  restartCommand: (projectName: string, commandName: string) => void;
  clearLogs: (projectName: string, commandName: string) => void;
  getProjectStatus: (projectName: string) => ProcessStatus;
  getDependents: (name: string) => string[];
  confirmAction: ConfirmActionDef | null;
  setConfirmAction: (v: ConfirmActionDef | null) => void;
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
