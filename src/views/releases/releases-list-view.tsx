import React from "react";
import { Box } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { useReleasesContext } from "./releases-context.ts";
import { DefinitionSidebar } from "./definition-sidebar.tsx";
import { ReleaseList } from "./release-list.tsx";
import { ReleaseStatusBar } from "./status-bar.tsx";

export function ReleasesListView() {
  const {
    config,
    removePinnedReleaseDefinition,
    onQuit,
    contentHeight: height,
    width,
  } = useAppContext();
  const { navigate } = useRouter();
  const {
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
  } = useReleasesContext();

  useRouteShortcuts(
    {
      quit: onQuit,
      refresh: () => {
        // No-op for now (definitions auto-refresh)
      },
      add: () => navigate("releases/search"),
      remove: () => {
        if (focus === "sidebar" && sidebarIndex < definitions.length) {
          const def = definitions[sidebarIndex];
          if (def) {
            removePinnedReleaseDefinition(def.id);
            setSidebarIndex((i) => Math.max(0, i - 1));
          }
        }
      },
      open: () => {
        if (focus === "list" && releases.length > 0) {
          const release = releases[listIndex];
          if (release && config.azureOrg && config.azureProject) {
            openInBrowser(
              `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_releaseProgress?_a=release-pipeline-progress&releaseId=${release.id}`,
            );
          }
        }
      },
      select: () => {
        if (focus === "sidebar") {
          if (sidebarIndex === definitions.length) {
            navigate("releases/search");
          }
        } else if (focus === "list" && releases.length > 0) {
          const release = releases[listIndex];
          if (release && config.azureOrg && config.azureProject) {
            openInBrowser(
              `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_releaseProgress?_a=release-pipeline-progress&releaseId=${release.id}`,
            );
          }
        }
      },
      left: () => setFocus("sidebar"),
      right: () => setFocus("list"),
    },
    {
      onUnhandled: (_input, key) => {
        // Navigation depends on focus area
        if (focus === "sidebar") {
          const maxIdx = definitions.length; // +1 for "[+] Add"
          if (key.upArrow) setSidebarIndex((i: number) => Math.max(0, i - 1));
          if (key.downArrow)
            setSidebarIndex((i: number) => Math.min(maxIdx, i + 1));
        }
        if (focus === "list" && releases.length > 0) {
          const maxIdx = releases.length - 1;
          if (key.upArrow) setListIndex((i: number) => Math.max(0, i - 1));
          if (key.downArrow)
            setListIndex((i: number) => Math.min(maxIdx, i + 1));
        }
      },
    },
  );

  const statusBarHeight = 3;
  const mainHeight = height - statusBarHeight;

  // Sidebar width adapts to longest definition name (min 20, max 40%)
  const longestName = Math.max(
    "[+] Add definition".length,
    ...definitions.map((d) => d.name.length + 4), // prefix + padding
  );
  const sidebarWidth = Math.min(
    Math.max(longestName + 4, 20),
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth;

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <DefinitionSidebar
          definitions={definitions}
          selectedIndex={sidebarIndex}
          isFocused={focus === "sidebar"}
          width={sidebarWidth}
        />
        <ReleaseList
          releases={releases}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={focus === "list"}
          loading={releasesLoading}
          definitionName={selectedDefinition?.name ?? ""}
        />
      </Box>

      {/* Status bar */}
      <ReleaseStatusBar
        selectedDefinition={selectedDefinition}
        releaseCount={releases.length}
        fetching={fetching}
        width={width}
      />
    </Box>
  );
}
