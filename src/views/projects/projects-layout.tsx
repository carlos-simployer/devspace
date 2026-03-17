import React, { useState } from "react";
import { Box } from "ink";
import { useLocalProcesses } from "../../hooks/use-local-processes.ts";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import {
  ProjectsContext,
  type ProjectsContextValue,
  type ProjectFocus,
  type ConfirmActionDef,
} from "./projects-context.ts";

export function ProjectsLayout() {
  const { config, contentHeight: height, width } = useAppContext();
  const localProjects = config.localProjects;
  const outlet = useOutlet();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [focus, setFocus] = useState<ProjectFocus>("sidebar");
  const [confirmAction, setConfirmAction] = useState<ConfirmActionDef | null>(
    null,
  );

  const {
    states,
    startCommand,
    startAll,
    stopOne,
    stopAll,
    restartCommand,
    clearLogs,
    getProjectStatus,
    getDependents,
  } = useLocalProcesses(localProjects);

  const ctx: ProjectsContextValue = {
    selectedIndex,
    setSelectedIndex,
    selectedCommandIndex,
    setSelectedCommandIndex,
    focus,
    setFocus,
    states,
    startCommand,
    startAll,
    stopOne,
    stopAll,
    restartCommand,
    clearLogs,
    getProjectStatus,
    getDependents,
    confirmAction,
    setConfirmAction,
  };

  // For overlay children: center them
  if (outlet?.isOverlay) {
    return (
      <ProjectsContext.Provider value={ctx}>
        <Box
          height={height}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </ProjectsContext.Provider>
    );
  }

  // For full children (index): render directly
  return (
    <ProjectsContext.Provider value={ctx}>
      <Outlet />
    </ProjectsContext.Provider>
  );
}
