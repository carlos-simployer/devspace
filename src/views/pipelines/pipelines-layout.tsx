import React, { useEffect, useRef } from "react";
import { Box, Text } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet, useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { FocusProvider, useFocus } from "../../ui/focus.ts";
import { usePipelines } from "../../hooks/use-pipelines.ts";
import { useAllPipelineDefinitions } from "../../hooks/use-pipelines.ts";
import { usePipelineRuns } from "../../hooks/use-pipeline-runs.ts";
import {
  PipelinesContext,
  type PipelinesContextValue,
} from "./pipelines-context.ts";
import { PipelinesListView } from "./pipelines-list-view.tsx";
import { pipelinesStore } from "./pipelines-store.ts";

export function PipelinesLayout() {
  const { config, contentHeight, width, onQuit } = useAppContext();
  const { route } = useRouter();
  const outlet = useOutlet();

  // Enables tab switching, number keys, quit even on "not configured" screen.
  useRouteShortcuts({ quit: onQuit });

  const {
    focus,
    setFocus,
    sidebarIndex,
    setSidebarIndex,
    listIndex,
    setListIndex,
  } = useStore(pipelinesStore);

  const isConfigured = !!config.azureOrg && !!config.azureProject;

  const { pipelines, loading, fetching, refetch } = usePipelines(
    config.azureOrg,
    config.azureProject,
    config.pinnedPipelines,
    config.refreshInterval,
  );

  const { definitions, loading: defsLoading } = useAllPipelineDefinitions(
    config.azureOrg,
    config.azureProject,
  );

  const selectedPipeline = pipelines[listIndex] ?? null;

  const showRuns = route === "pipelines/runs";
  const {
    runs,
    loading: runsLoading,
    error: runsError,
  } = usePipelineRuns(
    config.azureOrg,
    config.azureProject,
    showRuns ? (selectedPipeline?.id ?? null) : null,
  );

  // Reset list index when pipelines change
  useEffect(() => {
    if (listIndex >= pipelines.length) {
      setListIndex(Math.max(0, pipelines.length - 1));
    }
  }, [pipelines.length, listIndex]);

  if (!isConfigured) {
    return (
      <Box
        height={contentHeight}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <Text dimColor>
          Azure DevOps not configured. Press 8 to open Config.
        </Text>
      </Box>
    );
  }

  const ctx: PipelinesContextValue = {
    focus,
    setFocus,
    sidebarIndex,
    setSidebarIndex,
    listIndex,
    setListIndex,
    pipelines,
    selectedPipeline,
    loading,
    fetching,
    refetch,
    definitions,
    defsLoading,
    runs,
    runsLoading,
    runsError,
  };

  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus={focus}>
      <PipelinesContext.Provider value={ctx}>
        <FocusSync setFocus={setFocus} />
        <Box height={contentHeight} width={width}>
          {/* Main content layer — always show index view */}
          <Box height={contentHeight} width={width} flexDirection="column">
            {isOverlay ? <PipelinesListView /> : <Outlet />}
          </Box>

          {/* Overlay layer — dialog on top */}
          {isOverlay && (
            <Box
              position="absolute"
              width={width}
              height={contentHeight}
              alignItems="center"
              justifyContent="center"
            >
              <Outlet />
            </Box>
          )}
        </Box>
      </PipelinesContext.Provider>
    </FocusProvider>
  );
}

/**
 * FocusSync — syncs FocusProvider's focusedId back to the Zustand store.
 */
function FocusSync({
  setFocus,
}: {
  setFocus: (v: "sidebar" | "list") => void;
}) {
  const { focusedId } = useFocus();
  const prevRef = useRef(focusedId);

  useEffect(() => {
    if (focusedId !== prevRef.current) {
      prevRef.current = focusedId;
      if (focusedId === "sidebar" || focusedId === "list") {
        setFocus(focusedId);
      }
    }
  }, [focusedId, setFocus]);

  return null;
}
