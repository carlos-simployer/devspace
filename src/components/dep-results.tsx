import React from "react";
import { Box, Text } from "ink";
import type { DependencyResult } from "../api/types.ts";

interface Props {
  results: DependencyResult[];
  packageName: string;
  selectedIndex: number;
  height: number;
  width: number;
  isFocused: boolean;
  loading: boolean;
  error: string | null;
}

const COL = {
  selector: 2,
  version: 16,
  branch: 16,
  depType: 16,
} as const;

function getRepoWidth(totalWidth: number): number {
  const fixed = COL.selector + COL.version + COL.branch + COL.depType;
  return Math.max(20, totalWidth - fixed);
}

export const DepResults = React.memo(function DepResults({
  results,
  packageName,
  selectedIndex,
  height,
  width,
  isFocused,
  loading,
  error,
}: Props) {
  const listHeight = height - 1;
  const repoWidth = getRepoWidth(width);

  // Viewport windowing
  let startIndex = 0;
  if (results.length > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        results.length - listHeight,
      );
    }
  }
  const visible = results.slice(startIndex, startIndex + listHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text bold dimColor={!isFocused}>
          {"".padEnd(COL.selector)}
          <Text dimColor>{"Repository".padEnd(repoWidth)}</Text>
          {"Version".padEnd(COL.version)}
          {"Branch".padEnd(COL.branch)}
          {"Type".padEnd(COL.depType)}
        </Text>
      </Box>
      {loading && results.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text color="yellow">Searching for {packageName}...</Text>
        </Box>
      ) : error ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : results.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text dimColor>
            {packageName
              ? "No repos found using this package"
              : "Select a package to view results"}
          </Text>
        </Box>
      ) : (
        visible.map((result, i) => {
          const actualIndex = startIndex + i;
          const isSelected = isFocused && actualIndex === selectedIndex;

          return (
            <Box key={`${result.repo}:${result.depType}`}>
              <Text
                backgroundColor={isSelected ? "blue" : undefined}
                color={isSelected ? "white" : undefined}
              >
                {isSelected ? "> " : "  "}
                <Text color={isSelected ? "white" : "cyan"} bold={isSelected}>
                  {result.repo.padEnd(repoWidth)}
                </Text>
                <Text color={isSelected ? "white" : "yellow"}>
                  {result.version.padEnd(COL.version)}
                </Text>
                <Text
                  color={isSelected ? "white" : undefined}
                  dimColor={!isSelected}
                >
                  {result.branch.padEnd(COL.branch)}
                </Text>
                <Text
                  color={isSelected ? "white" : undefined}
                  dimColor={!isSelected}
                >
                  {result.depType}
                </Text>
              </Text>
            </Box>
          );
        })
      )}
    </Box>
  );
});
