import React, { useState } from "react";
import { Box, Text } from "ink";
import type { FocusArea } from "../../api/types.ts";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import {
  useReleaseDefinitions,
  useReleases,
  useAllReleaseDefinitions,
} from "../../hooks/use-releases.ts";
import {
  ReleasesContext,
  type ReleasesContextValue,
} from "./releases-context.ts";

export function ReleasesLayout() {
  const { config, contentHeight: height, width } = useAppContext();
  const outlet = useOutlet();

  const [focus, setFocus] = useState<FocusArea>("sidebar");
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);

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
          Azure DevOps not configured. Press 7 to open Config.
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
