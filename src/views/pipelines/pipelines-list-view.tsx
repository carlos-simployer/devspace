import React from "react";
import { Box, Text } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useFocusNode, useFocus } from "../../ui/focus.ts";
import { Panel } from "../../ui/panel.tsx";
import { getTheme } from "../../ui/theme.ts";
import { getBuildStatusIcon } from "../../utils/azure-status.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { usePipelinesContext } from "./pipelines-context.ts";
import { PipelineList } from "./pipeline-list.tsx";
import { PipelineStatusBar } from "./status-bar.tsx";

export function PipelinesListView() {
  const {
    config,
    removePinnedPipeline,
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
    pipelines,
    selectedPipeline,
    loading,
    fetching,
    refetch,
  } = usePipelinesContext();

  // ── Focus nodes ─────────────────────────────────────────────────────
  const { isFocused: sidebarFocused } = useFocusNode({
    id: "sidebar",
    order: 0,
  });
  const { isFocused: listFocused } = useFocusNode({
    id: "list",
    order: 1,
  });
  const { setFocus } = useFocus();

  const isMainView = route === "pipelines";

  useRouteShortcuts(
    {
      quit: onQuit,
      refresh: () => refetch(),
      add: () => navigate("pipelines/search"),
      runs: () => {
        if (selectedPipeline) navigate("pipelines/runs");
      },
    },
    {
      active: isMainView,
      focusHandlers: {
        sidebar: {
          up: () => setSidebarIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = config.pinnedPipelines.length; // +1 for "[+] Add"
            setSidebarIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            if (sidebarIndex === config.pinnedPipelines.length) {
              navigate("pipelines/search");
            } else {
              setListIndex(sidebarIndex);
              setFocus("list");
            }
          },
          open: () => {
            if (selectedPipeline) {
              const url = `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_build?definitionId=${selectedPipeline.id}`;
              openInBrowser(url);
            }
          },
          remove: () => {
            if (sidebarIndex < config.pinnedPipelines.length) {
              const id = config.pinnedPipelines[sidebarIndex];
              if (id !== undefined) {
                removePinnedPipeline(id);
                setSidebarIndex((i) => Math.max(0, i - 1));
              }
            }
          },
        },
        list: {
          up: () => setListIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = pipelines.length - 1;
            setListIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            if (selectedPipeline) {
              navigate("pipelines/runs");
            }
          },
          open: () => {
            if (selectedPipeline) {
              const url = `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_build?definitionId=${selectedPipeline.id}`;
              openInBrowser(url);
            }
          },
        },
      },
    },
  );

  const statusBarHeight = 3;
  const mainHeight = height - statusBarHeight;

  // Sidebar width adapts to longest pipeline name (min 20, max 40% of screen)
  const longestName = Math.max(
    "[+] Add pipeline".length,
    ...pipelines.map((p) => p.name.length + 5), // 2 prefix + " ..." suffix
  );
  const gap = 1;
  const sidebarWidth = Math.min(
    Math.max(longestName + 4, 20), // +4 for border + padding
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth - gap;

  // Build sidebar items
  const sidebarItems = [
    ...pipelines.map((p) => ({
      label: p.name,
      isAdd: false,
      pipeline: p,
    })),
    { label: "[+] Add pipeline", isAdd: true, pipeline: null },
  ];
  const sidebarInnerWidth = sidebarWidth - 2; // borders only, no padding

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight} gap={gap}>
        <Panel
          title="Pipelines"
          focused={sidebarFocused}
          width={sidebarWidth}
          height={mainHeight}
          paddingX={0}
        >
          {sidebarItems.map((item, i) => {
            const isActive = sidebarFocused && i === sidebarIndex;
            const isSelected = !item.isAdd && i === sidebarIndex;

            let prefix = "  ";
            let statusColor: string | undefined;
            if (!item.isAdd && item.pipeline) {
              const build = item.pipeline.latestBuild;
              if (build) {
                const info = getBuildStatusIcon(build.status, build.result);
                prefix = info.icon + " ";
                statusColor = info.color;
              } else {
                prefix = "\u2014 ";
              }
            }

            const label =
              item.label.length > sidebarInnerWidth - 3
                ? item.label.slice(0, sidebarInnerWidth - 4) + "\u2026"
                : item.label;
            const text = prefix + label;
            const padded = isActive ? text.padEnd(sidebarInnerWidth) : text;

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
                          : statusColor
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
        <PipelineList
          pipelines={pipelines}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={listFocused}
          loading={loading}
        />
      </Box>

      {/* Status bar */}
      <PipelineStatusBar
        selectedPipeline={selectedPipeline}
        pipelineCount={pipelines.length}
        fetching={fetching}
        width={width}
      />
    </Box>
  );
}
