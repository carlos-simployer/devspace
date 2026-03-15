import React, { useState, useCallback } from "react";
import { Box, Text } from "ink";
import type { Config, FocusArea } from "../../api/types.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { usePipelines } from "../../hooks/use-pipelines.ts";
import { useAllPipelineDefinitions } from "../../hooks/use-pipelines.ts";
import { usePipelineRuns } from "../../hooks/use-pipeline-runs.ts";
import { PipelineSidebar } from "./pipeline-sidebar.tsx";
import { PipelineList } from "./pipeline-list.tsx";
import { PipelineStatusBar } from "./status-bar.tsx";
import { PipelineSearch } from "./pipeline-search.tsx";
import { PipelineRuns } from "./pipeline-runs.tsx";
import { HelpOverlay } from "../../components/help-overlay.tsx";

interface Props {
  config: Config;
  addPinnedPipeline: (id: number) => void;
  removePinnedPipeline: (id: number) => void;
  onQuit: () => void;
  height: number;
  width: number;
}

export function PipelinesView({
  config,
  addPinnedPipeline,
  removePinnedPipeline,
  onQuit,
  height,
  width,
}: Props) {
  const { route, navigate } = useRouter();
  const showHelp = route === "pipelines/help";
  const showSearch = route === "pipelines/search";
  const showRuns = route === "pipelines/runs";

  const [focus, setFocus] = useState<FocusArea>("sidebar");
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);

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

  const {
    runs,
    loading: runsLoading,
    error: runsError,
  } = usePipelineRuns(
    config.azureOrg,
    config.azureProject,
    showRuns ? (selectedPipeline?.id ?? null) : null,
  );

  const openInBrowser = useCallback(async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  }, []);

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
          if (key.upArrow) setSidebarIndex((i) => Math.max(0, i - 1));
          if (key.downArrow) setSidebarIndex((i) => Math.min(maxIdx, i + 1));
        }
        if (focus === "list") {
          const maxIdx = pipelines.length - 1;
          if (key.upArrow) setListIndex((i) => Math.max(0, i - 1));
          if (key.downArrow) setListIndex((i) => Math.min(maxIdx, i + 1));
        }
      },
    },
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
          Azure DevOps not configured. Press 5 to open Config.
        </Text>
      </Box>
    );
  }

  if (showHelp) {
    return (
      <Box height={height} width={width}>
        <HelpOverlay
          height={height}
          width={width}
          view="pipelines"
          route="pipelines"
        />
      </Box>
    );
  }

  if (showRuns && selectedPipeline) {
    return (
      <PipelineRuns
        pipeline={selectedPipeline}
        runs={runs}
        loading={runsLoading}
        error={runsError}
        height={height}
        width={width}
        azureOrg={config.azureOrg}
        azureProject={config.azureProject}
        onClose={() => navigate("pipelines")}
        onOpenInBrowser={openInBrowser}
      />
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
        <PipelineSearch
          definitions={definitions}
          pinnedIds={config.pinnedPipelines}
          loading={defsLoading}
          onSelect={(id) => {
            addPinnedPipeline(id);
          }}
          onRemove={(id) => {
            removePinnedPipeline(id);
          }}
          onClose={() => navigate("pipelines")}
          height={height}
          width={width}
        />
      </Box>
    );
  }

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
