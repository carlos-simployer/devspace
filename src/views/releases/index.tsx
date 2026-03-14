import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type { AppView, Config, FocusArea } from "../../api/types.ts";
import { handleGlobalKeys } from "../../hooks/use-global-keys.ts";
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

interface Props {
  config: Config;
  addPinnedReleaseDefinition: (id: number) => void;
  removePinnedReleaseDefinition: (id: number) => void;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  onQuit: () => void;
  height: number;
  width: number;
}

export function ReleasesView({
  config,
  addPinnedReleaseDefinition,
  removePinnedReleaseDefinition,
  onSwitchView,
  onQuit,
  height,
  width,
}: Props) {
  const [focus, setFocus] = useState<FocusArea>("sidebar");
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

  useInput((input, key) => {
    if (showSearch) return;

    if (showHelp) {
      if (input === "?" || key.escape) setShowHelp(false);
      return;
    }

    if (
      handleGlobalKeys(input, key, {
        onQuit,
        onSwitchView,
        onHelp: () => setShowHelp(true),
      })
    )
      return;

    if (input === "R") {
      return;
    }

    if (input === "+") {
      setShowSearch(true);
      return;
    }

    // Focus switching
    if (key.leftArrow) {
      setFocus("sidebar");
      return;
    }
    if (key.rightArrow) {
      setFocus("list");
      return;
    }

    // Navigation
    if (focus === "sidebar") {
      const maxIdx = definitions.length; // +1 for "[+] Add"
      if (key.upArrow) setSidebarIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setSidebarIndex((i) => Math.min(maxIdx, i + 1));

      if (key.return) {
        if (sidebarIndex === definitions.length) {
          setShowSearch(true);
          return;
        }
      }

      if (
        (input === "d" || input === "-") &&
        sidebarIndex < definitions.length
      ) {
        const def = definitions[sidebarIndex];
        if (def) {
          removePinnedReleaseDefinition(def.id);
          setSidebarIndex((i) => Math.max(0, i - 1));
        }
      }
    }

    if (focus === "list" && releases.length > 0) {
      const maxIdx = releases.length - 1;
      if (key.upArrow) setListIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setListIndex((i) => Math.min(maxIdx, i + 1));
      if (key.return || input === "o") {
        const release = releases[listIndex];
        if (release && config.azureOrg && config.azureProject) {
          openInBrowser(
            `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_releaseProgress?_a=release-pipeline-progress&releaseId=${release.id}`,
          );
        }
      }
    }
  });

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
        <HelpOverlay height={height} width={width} view="releases" />
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

      {/* Definition search overlay */}
      {showSearch && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 60) / 2)}
          marginTop={Math.floor((height - 20) / 2)}
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
            onClose={() => setShowSearch(false)}
            height={height}
            width={width}
          />
        </Box>
      )}
    </Box>
  );
}
