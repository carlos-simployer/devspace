import React, { useState, useCallback } from "react";
import { Box, Text } from "ink";
import type { FocusArea } from "../../api/types.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import {
  useReleaseDefinitions,
  useReleases,
  useAllReleaseDefinitions,
} from "../../hooks/use-releases.ts";
import { DefinitionSidebar } from "./definition-sidebar.tsx";
import { ReleaseList } from "./release-list.tsx";
import { ReleaseStatusBar } from "./status-bar.tsx";
import { DefinitionSearch } from "./definition-search.tsx";
import { HelpOverlay } from "../../components/help-overlay.tsx";

export function ReleasesView() {
  const {
    config,
    addPinnedReleaseDefinition,
    removePinnedReleaseDefinition,
    onQuit,
    contentHeight: height,
    width,
  } = useAppContext();
  const { route, navigate } = useRouter();
  const showHelp = route === "releases/help";
  const showSearch = route === "releases/search";

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

  const openInBrowser = useCallback(async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  }, []);

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
          if (key.upArrow) setSidebarIndex((i) => Math.max(0, i - 1));
          if (key.downArrow) setSidebarIndex((i) => Math.min(maxIdx, i + 1));
        }
        if (focus === "list" && releases.length > 0) {
          const maxIdx = releases.length - 1;
          if (key.upArrow) setListIndex((i) => Math.max(0, i - 1));
          if (key.downArrow) setListIndex((i) => Math.min(maxIdx, i + 1));
        }
      },
    },
  );

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
          Azure DevOps not configured. Press 5 to open Config.
        </Text>
      </Box>
    );
  }

  if (showHelp) {
    return (
      <Box height={height} width={width}>
        <HelpOverlay height={height} width={width} route="releases" />
      </Box>
    );
  }

  if (showSearch) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <DefinitionSearch
          definitions={allDefinitions}
          pinnedIds={config.pinnedReleaseDefinitions}
          loading={allDefsLoading}
          onSelect={(id) => {
            addPinnedReleaseDefinition(id);
          }}
          onRemove={(id) => {
            removePinnedReleaseDefinition(id);
          }}
          onClose={() => navigate("releases")}
          height={height}
          width={width}
        />
      </Box>
    );
  }

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
