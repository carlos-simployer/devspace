import React, { useState, useRef, useEffect } from "react";
import { Box } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import { FocusProvider, useFocus } from "../../ui/focus.ts";
import {
  ProjectsContext,
  type ProjectsContextValue,
  type ConfirmActionDef,
} from "./projects-context.ts";
import { ProjectsListView } from "./projects-list-view.tsx";
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

  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus={focus}>
      <ProjectsContext.Provider value={ctx}>
        <FocusSync setFocus={setFocus} />
        <Box height={height} width={width}>
          {/* Main content layer -- always show index view */}
          <Box height={height} width={width} flexDirection="column">
            {isOverlay ? <ProjectsListView /> : <Outlet />}
          </Box>

          {/* Overlay layer -- dialog on top */}
          {isOverlay && (
            <Box
              position="absolute"
              width={width}
              height={height}
              alignItems="center"
              justifyContent="center"
            >
              <Outlet />
            </Box>
          )}
        </Box>
      </ProjectsContext.Provider>
    </FocusProvider>
  );
}

/**
 * FocusSync -- syncs FocusProvider's focusedId back to the Zustand store.
 * Must be rendered inside both FocusProvider and ProjectsContext.Provider.
 */
function FocusSync({
  setFocus,
}: {
  setFocus: (v: "sidebar" | "commands") => void;
}) {
  const { focusedId } = useFocus();
  const prevRef = useRef(focusedId);

  useEffect(() => {
    if (focusedId !== prevRef.current) {
      prevRef.current = focusedId;
      if (focusedId === "sidebar" || focusedId === "commands") {
        setFocus(focusedId);
      }
    }
  }, [focusedId, setFocus]);

  return null;
}
