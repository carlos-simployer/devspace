import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { AzurePipelineDefinition } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { TableHeader } from "../../ui/table-row.tsx";
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
  // Panel borders (2) + header (1) + margin (1) = 4
  const panelContentHeight = height - 2;
  const listHeight = panelContentHeight - 2;
  // Inner width = panel width minus borders (2) minus paddingX (2)
  const innerWidth = width - 4;
  const nameWidth = getNameWidth(innerWidth);

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

  const count =
    pipelines.length > 0
      ? `${Math.min(selectedIndex + 1, pipelines.length)} of ${pipelines.length}`
      : undefined;

  return (
    <Panel
      title="Builds"
      focused={isFocused}
      width={width}
      height={height}
      count={count}
    >
      <Box marginBottom={1}>
        <TableHeader
          width={innerWidth}
          dimColor={!isFocused}
          bold
          columns={[
            { width: COL.selector, label: "" },
            { width: COL.status, label: "St", dimColor: true },
            { flex: 1, label: "Pipeline" },
            { width: COL.buildNum, label: "Build #" },
            { width: COL.reason, label: "Reason" },
            { width: COL.branch, label: "Branch" },
            { width: COL.time, label: "Time" },
            { width: COL.duration, label: "Duration" },
          ]}
        />
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
              width={innerWidth}
            />
          );
        })
      )}
    </Panel>
  );
}
