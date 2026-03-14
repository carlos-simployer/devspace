import React from "react";
import { Box, Text } from "ink";
import type { AzurePipelineDefinition } from "../../api/types.ts";
import { getBuildStatusIcon } from "../../utils/azure-status.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  pipelines: AzurePipelineDefinition[];
  selectedIndex: number;
  isFocused: boolean;
  width: number;
}

export const PipelineSidebar = React.memo(function PipelineSidebar({
  pipelines,
  selectedIndex,
  isFocused,
  width,
}: Props) {
  const items = [
    ...pipelines.map((p) => ({ label: p.name, isAdd: false, pipeline: p })),
    { label: "[+] Add pipeline", isAdd: true, pipeline: null },
  ];

  // Inner content width = total width - border (1) - paddingRight (1)
  const innerWidth = width - 2;

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderRight
      borderLeft={false}
      borderTop={false}
      borderBottom={false}
      paddingRight={1}
    >
      <Text bold dimColor={!isFocused}>
        Pipelines
      </Text>
      {items.map((item, i) => {
        const isActive = isFocused && i === selectedIndex;
        const isSelected = !item.isAdd && i === selectedIndex;

        let prefix = "  ";
        let statusColor: string | undefined;
        if (!item.isAdd && item.pipeline) {
          const build = item.pipeline.latestBuild;
          if (build) {
            const info = getBuildStatusIcon(build.status, build.result);
            prefix = info.icon + " ";
            statusColor = info.color;
          } else {
            prefix = "— ";
          }
        }

        const label =
          item.label.length > innerWidth - 3
            ? item.label.slice(0, innerWidth - 4) + "…"
            : item.label;
        const text = prefix + label;
        const padded = isActive ? text.padEnd(innerWidth) : text;

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
              dimColor={!isFocused && !isSelected && !isActive}
            >
              {padded}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
});
