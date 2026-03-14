import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { AzureRelease } from "../../api/types.ts";
import { ReleaseRow } from "./release-row.tsx";

interface Props {
  releases: AzureRelease[];
  selectedIndex: number;
  height: number;
  width: number;
  isFocused: boolean;
  loading: boolean;
  definitionName: string;
}

const COL = {
  selector: 2,
  name: 18,
  created: 10,
} as const;

function getSourceWidth(totalWidth: number): number {
  const fixed = COL.selector + COL.name + COL.created;
  return Math.max(20, Math.floor((totalWidth - fixed) * 0.5));
}

export const ReleaseList = React.memo(function ReleaseList({
  releases,
  selectedIndex,
  height,
  width,
  isFocused,
  loading,
  definitionName,
}: Props) {
  const listHeight = height - 1;
  const sourceWidth = getSourceWidth(width);

  // Viewport windowing
  let startIndex = 0;
  if (releases.length > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        releases.length - listHeight,
      );
    }
  }
  const visible = releases.slice(startIndex, startIndex + listHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text bold dimColor={!isFocused}>
          {"".padEnd(COL.selector)}
          <Text dimColor>{"Release".padEnd(COL.name)}</Text>
          {"Source".padEnd(sourceWidth)}
          {"Created".padEnd(COL.created)}
          {"Stages"}
        </Text>
      </Box>
      {loading && releases.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Spinner label="Loading releases..." />
        </Box>
      ) : releases.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text dimColor>
            {definitionName ? "No releases found" : "Select a definition"}
          </Text>
        </Box>
      ) : (
        visible.map((release, i) => {
          const actualIndex = startIndex + i;
          const isSelected = isFocused && actualIndex === selectedIndex;
          return (
            <ReleaseRow
              key={release.id}
              release={release}
              isSelected={isSelected}
              width={width}
            />
          );
        })
      )}
    </Box>
  );
});
