import React from "react";
import { Box, Text } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet, useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { usePipelines } from "../../hooks/use-pipelines.ts";
import { useAllPipelineDefinitions } from "../../hooks/use-pipelines.ts";
import { usePipelineRuns } from "../../hooks/use-pipeline-runs.ts";
import {
  PipelinesContext,
  type PipelinesContextValue,
} from "./pipelines-context.ts";
import { pipelinesStore } from "./pipelines-store.ts";

export function PipelinesLayout() {
  const { config, contentHeight: height, width, onQuit } = useAppContext();
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
  React.useEffect(() => {
    if (listIndex >= pipelines.length) {
      setListIndex(Math.max(0, pipelines.length - 1));
    }
  }, [pipelines.length, listIndex]);

  if (!isConfigured) {
    return (
      <Box
        height={height}
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

  // For overlay children: center them
  if (outlet?.isOverlay) {
    return (
      <PipelinesContext.Provider value={ctx}>
        <Box
          height={height}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </PipelinesContext.Provider>
    );
  }

  // For full children (index, runs): render directly
  return (
    <PipelinesContext.Provider value={ctx}>
      <Outlet />
    </PipelinesContext.Provider>
  );
}
