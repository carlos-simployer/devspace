import React, { useState } from "react";
import { Box } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import {
  ProjectsContext,
  type ProjectsContextValue,
  type ConfirmActionDef,
} from "./projects-context.ts";
import { projectsStore } from "./projects-store.ts";

export function ProjectsLayout() {
  const {
    contentHeight: height,
    width,
    processStates: states,
    startCommand,
    startAll,
    stopOne,
    stopAll,
    restartCommand,
    clearLogs,
    getProjectStatus,
    getDependents,
  } = useAppContext();
  const outlet = useOutlet();

  const {
    selectedIndex,
    setSelectedIndex,
    selectedCommandIndex,
    setSelectedCommandIndex,
    focus,
    setFocus,
  } = useStore(projectsStore);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionDef | null>(
    null,
  );

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
