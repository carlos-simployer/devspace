import React from "react";
import { Box, Text } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useFocusNode } from "../../ui/focus.ts";
import { Panel } from "../../ui/panel.tsx";
import { getTheme } from "../../ui/theme.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { useReleasesContext } from "./releases-context.ts";
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
  const { navigate, route } = useRouter();
  const {
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

  // ── Focus nodes ─────────────────────────────────────────────────────
  const { isFocused: sidebarFocused } = useFocusNode({
    id: "sidebar",
    order: 0,
  });
  const { isFocused: listFocused } = useFocusNode({
    id: "list",
    order: 1,
  });

  const isMainView = route === "releases";

  useRouteShortcuts(
    {
      quit: onQuit,
      refresh: () => {
        // No-op for now (definitions auto-refresh)
      },
      add: () => navigate("releases/search"),
    },
    {
      active: isMainView,
      focusHandlers: {
        sidebar: {
          up: () => setSidebarIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = definitions.length; // +1 for "[+] Add"
            setSidebarIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            if (sidebarIndex === definitions.length) {
              navigate("releases/search");
            }
          },
          open: () => {
            if (sidebarIndex === definitions.length) {
              navigate("releases/search");
            }
          },
          remove: () => {
            if (sidebarIndex < definitions.length) {
              const def = definitions[sidebarIndex];
              if (def) {
                removePinnedReleaseDefinition(def.id);
                setSidebarIndex((i) => Math.max(0, i - 1));
              }
            }
          },
        },
        list: {
          up: () => setListIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = releases.length - 1;
            setListIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            const release = releases[listIndex];
            if (release && config.azureOrg && config.azureProject) {
              openInBrowser(
                `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_releaseProgress?_a=release-pipeline-progress&releaseId=${release.id}`,
              );
            }
          },
          open: () => {
            const release = releases[listIndex];
            if (release && config.azureOrg && config.azureProject) {
              openInBrowser(
                `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_releaseProgress?_a=release-pipeline-progress&releaseId=${release.id}`,
              );
            }
          },
        },
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
  const gap = 1;
  const sidebarWidth = Math.min(
    Math.max(longestName + 4, 20),
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth - gap;

  // Build sidebar items
  const sidebarItems = [
    ...definitions.map((d) => ({
      label: d.name,
      isAdd: false,
      def: d,
    })),
    { label: "[+] Add definition", isAdd: true, def: null },
  ];
  const sidebarInnerWidth = sidebarWidth - 2; // borders only, no padding

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight} gap={gap}>
        <Panel
          title="Release Definitions"
          focused={sidebarFocused}
          width={sidebarWidth}
          height={mainHeight}
          paddingX={0}
        >
          {sidebarItems.map((item, i) => {
            const isActive = sidebarFocused && i === sidebarIndex;
            const isSelected = !item.isAdd && i === sidebarIndex;
            const prefix = isSelected && !item.isAdd ? "\u25CF " : "  ";
            const text = prefix + item.label;
            const truncated =
              text.length > sidebarInnerWidth
                ? text.slice(0, sidebarInnerWidth - 1) + "\u2026"
                : text;
            const padded = isActive
              ? truncated.padEnd(sidebarInnerWidth)
              : truncated;

            return (
              <Box key={item.label + i}>
                <Text
                  inverse={isActive}
                  color={
                    isActive
                      ? undefined
                      : item.isAdd
                        ? getTheme().list.addAction
                        : isSelected
                          ? "white"
                          : undefined
                  }
                  bold={isActive || isSelected}
                  dimColor={!sidebarFocused && !isSelected && !isActive}
                >
                  {padded}
                </Text>
              </Box>
            );
          })}
        </Panel>
        <ReleaseList
          releases={releases}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={listFocused}
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
