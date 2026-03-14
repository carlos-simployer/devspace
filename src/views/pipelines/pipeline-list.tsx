import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { AzurePipelineDefinition } from "../../api/types.ts";
import { PipelineRow, COL, getNameWidth } from "./pipeline-row.tsx";

interface Props {
  pipelines: AzurePipelineDefinition[];
  selectedIndex: number;
  height: number;
  width: number;
  isFocused: boolean;
  loading: boolean;
}

export function PipelineList({
  pipelines,
  selectedIndex,
  height,
  width,
  isFocused,
  loading,
}: Props) {
  const listHeight = height - 2;
  const nameWidth = getNameWidth(width);

  // Viewport windowing
  let startIndex = 0;
  if (pipelines.length > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        pipelines.length - listHeight,
      );
    }
  }
  const visible = pipelines.slice(startIndex, startIndex + listHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold dimColor={!isFocused}>
          {"".padEnd(COL.selector)}
          <Text dimColor>{"St".padEnd(COL.status)}</Text>
          {"Pipeline".padEnd(nameWidth)}
          {"Build #".padEnd(COL.buildNum)}
          {"Reason".padEnd(COL.reason)}
          {"Branch".padEnd(COL.branch)}
          {"Time".padEnd(COL.time)}
          {"Duration".padEnd(COL.duration)}
        </Text>
      </Box>
      {loading ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Spinner label="Loading pipelines..." />
        </Box>
      ) : pipelines.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text dimColor>No pipelines pinned. Press + to add.</Text>
        </Box>
      ) : (
        visible.map((pipeline, i) => {
          const actualIndex = startIndex + i;
          return (
            <PipelineRow
              key={pipeline.id}
              pipeline={pipeline}
              isSelected={isFocused && actualIndex === selectedIndex}
              width={width}
            />
          );
        })
      )}
    </Box>
  );
}
