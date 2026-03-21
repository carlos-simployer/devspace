import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { AzurePipelineDefinition } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { relativeTime } from "../../utils/time.ts";

interface Props {
  selectedPipeline: AzurePipelineDefinition | null;
  pipelineCount: number;
  fetching: boolean;
  width: number;
}

export const PipelineStatusBar = React.memo(function PipelineStatusBar({
  selectedPipeline,
  pipelineCount,
  fetching,
  width,
}: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const lastRun = selectedPipeline?.latestBuild?.queueTime;
  const lastRunText = lastRun
    ? `Last run: ${relativeTime(lastRun).text} ago`
    : "";
  const fetchingText = fetching ? "Refreshing..." : "";

  return (
    <Panel width={width} paddingX={0}>
      <Box>
        <Text wrap="truncate">
          <Text bold> Pipelines: {pipelineCount} pinned </Text>
          <Text dimColor>|</Text>
          <Text> Selected: {selectedPipeline?.name ?? "none"} </Text>
          <Text dimColor>|</Text>
          <Text dimColor> {lastRunText} </Text>
          {fetchingText ? (
            <>
              <Text dimColor>|</Text>
              <Text dimColor> {fetchingText} </Text>
            </>
          ) : null}
        </Text>
      </Box>
    </Panel>
  );
});
