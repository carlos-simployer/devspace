import React from "react";
import { Box, Text } from "ink";
import type { AzureReleaseDefinition } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";

interface Props {
  selectedDefinition: AzureReleaseDefinition | null;
  releaseCount: number;
  fetching: boolean;
  width: number;
}

export const ReleaseStatusBar = React.memo(function ReleaseStatusBar({
  selectedDefinition,
  releaseCount,
  fetching,
  width,
}: Props) {
  const envNames = selectedDefinition
    ? selectedDefinition.environments.map((e) => e.name).join(", ")
    : "";

  return (
    <Panel width={width} paddingX={0}>
      <Box>
        <Text>
          <Text bold> Definition: {selectedDefinition?.name ?? "none"} </Text>
          <Text dimColor>|</Text>
          <Text> {releaseCount} releases </Text>
          {envNames ? (
            <>
              <Text dimColor>|</Text>
              <Text> Environments: {envNames} </Text>
            </>
          ) : null}
          {fetching ? (
            <>
              <Text dimColor>|</Text>
              <Text dimColor> Refreshing... </Text>
            </>
          ) : null}
        </Text>
      </Box>
    </Panel>
  );
});
