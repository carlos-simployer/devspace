import React from "react";
import { Box } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { usePipelinesContext } from "./pipelines-context.ts";
import { PipelineSidebar } from "./pipeline-sidebar.tsx";
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
  const { navigate } = useRouter();
  const {
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
  } = usePipelinesContext();

  useRouteShortcuts(
    {
      quit: onQuit,
      refresh: () => refetch(),
      add: () => navigate("pipelines/search"),
      remove: () => {
        if (
          focus === "sidebar" &&
          sidebarIndex < config.pinnedPipelines.length
        ) {
          const id = config.pinnedPipelines[sidebarIndex];
          if (id !== undefined) {
            removePinnedPipeline(id);
            setSidebarIndex((i) => Math.max(0, i - 1));
          }
        }
      },
      open: () => {
        if (selectedPipeline) {
          const url = `https://dev.azure.com/${config.azureOrg}/${config.azureProject}/_build?definitionId=${selectedPipeline.id}`;
          openInBrowser(url);
        }
      },
      runs: () => {
        if (selectedPipeline) navigate("pipelines/runs");
      },
      select: () => {
        if (focus === "sidebar") {
          if (sidebarIndex === config.pinnedPipelines.length) {
            navigate("pipelines/search");
          } else {
            setListIndex(sidebarIndex);
            setFocus("list");
          }
        } else if (selectedPipeline) {
          navigate("pipelines/runs");
        }
      },
      left: () => setFocus("sidebar"),
      right: () => setFocus("list"),
    },
    {
      onUnhandled: (_input, key) => {
        // Navigation depends on focus area
        if (focus === "sidebar") {
          const maxIdx = config.pinnedPipelines.length; // +1 for "[+] Add"
          if (key.upArrow) setSidebarIndex((i: number) => Math.max(0, i - 1));
          if (key.downArrow)
            setSidebarIndex((i: number) => Math.min(maxIdx, i + 1));
        }
        if (focus === "list") {
          const maxIdx = pipelines.length - 1;
          if (key.upArrow) setListIndex((i: number) => Math.max(0, i - 1));
          if (key.downArrow)
            setListIndex((i: number) => Math.min(maxIdx, i + 1));
        }
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
  const sidebarWidth = Math.min(
    Math.max(longestName + 4, 20), // +4 for border + padding
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth;

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <PipelineSidebar
          pipelines={pipelines}
          selectedIndex={focus === "sidebar" ? sidebarIndex : -1}
          isFocused={focus === "sidebar"}
          width={sidebarWidth}
        />
        <PipelineList
          pipelines={pipelines}
          selectedIndex={listIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={focus === "list"}
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
