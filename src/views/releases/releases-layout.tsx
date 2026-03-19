import React from "react";
import { Box, Text } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import {
  useReleaseDefinitions,
  useReleases,
  useAllReleaseDefinitions,
} from "../../hooks/use-releases.ts";
import {
  ReleasesContext,
  type ReleasesContextValue,
} from "./releases-context.ts";
import { releasesStore } from "./releases-store.ts";

export function ReleasesLayout() {
  const { config, contentHeight: height, width, onQuit } = useAppContext();
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
  } = useStore(releasesStore);

  const { definitions, fetching } = useReleaseDefinitions(
    config.azureOrg,
    config.azureProject,
    config.pinnedReleaseDefinitions,
    config.refreshInterval,
  );

  const selectedDefinition = definitions[sidebarIndex] ?? null;

  const { releases, loading: releasesLoading } = useReleases(
    config.azureOrg,
    config.azureProject,
    selectedDefinition?.id ?? null,
  );

  const { definitions: allDefinitions, loading: allDefsLoading } =
    useAllReleaseDefinitions(config.azureOrg, config.azureProject);

  // Reset list index when switching definitions
  React.useEffect(() => {
    setListIndex(0);
  }, [sidebarIndex]);

  // Not configured
  if (!config.azureOrg || !config.azureProject) {
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

  const ctx: ReleasesContextValue = {
    focus,
    setFocus,
    sidebarIndex,
    setSidebarIndex,
    listIndex,
    setListIndex,
    definitions,
    selectedDefinition,
    releases,
    releasesLoading,
    fetching,
    allDefinitions,
    allDefsLoading,
  };

  // For overlay children: center them
  if (outlet?.isOverlay) {
    return (
      <ReleasesContext.Provider value={ctx}>
        <Box
          height={height}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </ReleasesContext.Provider>
    );
  }

  // For full children (index): render directly
  return (
    <ReleasesContext.Provider value={ctx}>
      <Outlet />
    </ReleasesContext.Provider>
  );
}
