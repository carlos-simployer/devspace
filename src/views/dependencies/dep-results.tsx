import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { DependencyResult } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { TableRow, TableHeader } from "../../ui/table-row.tsx";
import { getTheme } from "../../ui/theme.ts";

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
  // Panel borders (2) + header row (1) + margin (1) = 4
  const panelContentHeight = height - 2;
  const listHeight = panelContentHeight - 2;
  // Inner width = panel width minus borders (2) minus paddingX (2)
  const innerWidth = width - 4;
  const repoWidth = getRepoWidth(innerWidth);

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

  const count =
    results.length > 0
      ? `${Math.min(selectedIndex + 1, results.length)} of ${results.length}`
      : undefined;

  return (
    <Panel
      title="Results"
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
            { flex: 1, label: "Repository", dimColor: true },
            { width: COL.version, label: "Version" },
            { width: COL.branch, label: "Branch" },
            { width: COL.depType, label: "Type" },
          ]}
        />
      </Box>
      {error && results.length > 0 ? (
        <Box paddingLeft={2}>
          <Text color={getTheme().status.failure}>
            {error} — showing cached results
          </Text>
        </Box>
      ) : null}
      {loading && results.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Spinner label={"Searching for " + packageName + "..."} />
        </Box>
      ) : error && results.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text color={getTheme().status.failure}>{error}</Text>
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
            <TableRow
              key={`${result.repo}:${result.depType}`}
              selected={isSelected}
              width={innerWidth}
              columns={[
                {
                  width: COL.selector,
                  content: isSelected ? "> " : "  ",
                },
                {
                  flex: 1,
                  content: result.repo,
                  bold: isSelected,
                },
                {
                  width: COL.version,
                  content: result.version,
                  color: getTheme().status.pending,
                },
                {
                  width: COL.branch,
                  content: result.branch,
                  dimColor: true,
                },
                {
                  width: COL.depType,
                  content: result.depType,
                  dimColor: true,
                },
              ]}
            />
          );
        })
      )}
    </Panel>
  );
});
