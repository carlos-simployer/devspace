import React, { useEffect, useRef } from "react";
import { Box, Text } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { FocusProvider, useFocus } from "../../ui/focus.ts";
import {
  useReleaseDefinitions,
  useReleases,
  useAllReleaseDefinitions,
} from "../../hooks/use-releases.ts";
import {
  ReleasesContext,
  type ReleasesContextValue,
} from "./releases-context.ts";
import { ReleasesListView } from "./releases-list-view.tsx";
import { releasesStore } from "./releases-store.ts";

export function ReleasesLayout() {
  const { config, contentHeight, width, onQuit } = useAppContext();
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
  useEffect(() => {
    setListIndex(0);
  }, [sidebarIndex]);

  // Not configured
  if (!config.azureOrg || !config.azureProject) {
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

  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus={focus}>
      <ReleasesContext.Provider value={ctx}>
        <FocusSync setFocus={setFocus} />
        <Box height={contentHeight} width={width}>
          {/* Main content layer — always show index view */}
          <Box height={contentHeight} width={width} flexDirection="column">
            {isOverlay ? <ReleasesListView /> : <Outlet />}
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
      </ReleasesContext.Provider>
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
