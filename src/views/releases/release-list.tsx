import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { AzureRelease } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { TableHeader } from "../../ui/table-row.tsx";
import { ReleaseRow } from "./release-row.tsx";
import {
  groupByTimeBucketGeneric,
  flattenGroupsGeneric,
  type GenericFlatRow,
} from "../../utils/time-buckets.ts";
import { getTheme } from "../../ui/theme.ts";

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
  // Panel borders (2) + header (1) + margin (1) = 4
  const panelContentHeight = height - 2;
  const listHeight = panelContentHeight - 2;
  // Inner width = panel width minus borders (2) minus paddingX (2)
  const innerWidth = width - 4;
  const sourceWidth = getSourceWidth(innerWidth);
  const theme = getTheme();

  // Group releases by time bucket
  const groups = useMemo(
    () => groupByTimeBucketGeneric(releases, (r) => r.createdOn),
    [releases],
  );
  const flatRows: GenericFlatRow<AzureRelease>[] = useMemo(
    () => flattenGroupsGeneric(groups),
    [groups],
  );

  // Calculate visual line positions (headers after first get +1 margin)
  const rowVisualPos = useMemo(() => {
    const positions: number[] = [];
    let line = 0;
    let seenHeader = false;
    for (const row of flatRows) {
      if (row.type === "header" && seenHeader) line++;
      if (row.type === "header") seenHeader = true;
      positions.push(line);
      line++;
    }
    return positions;
  }, [flatRows]);

  const totalVisualLines =
    rowVisualPos.length > 0 ? rowVisualPos[rowVisualPos.length - 1]! + 1 : 0;

  // Find the flat-row index of the selected release
  const selectedRowIdx = useMemo(() => {
    for (let i = 0; i < flatRows.length; i++) {
      const row = flatRows[i]!;
      if (row.type === "item" && row.itemIndex === selectedIndex) return i;
    }
    return 0;
  }, [flatRows, selectedIndex]);

  // Viewport: keep selected row centered
  let visualStart = 0;
  if (totalVisualLines > listHeight) {
    const selectedVisual = rowVisualPos[selectedRowIdx] ?? 0;
    const halfView = Math.floor(listHeight / 2);
    visualStart = Math.max(
      0,
      Math.min(selectedVisual - halfView, totalVisualLines - listHeight),
    );
  }

  // Collect visible rows within viewport
  const visibleRows: GenericFlatRow<AzureRelease>[] = [];
  for (let i = 0; i < flatRows.length; i++) {
    const pos = rowVisualPos[i]!;
    if (pos >= visualStart && pos < visualStart + listHeight) {
      visibleRows.push(flatRows[i]!);
    } else if (pos >= visualStart + listHeight) {
      break;
    }
  }

  const count =
    releases.length > 0
      ? `${Math.min(selectedIndex + 1, releases.length)} of ${releases.length}`
      : undefined;

  return (
    <Panel
      title="Releases"
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
            { width: COL.name, label: "Release", dimColor: true },
            { width: sourceWidth, label: "Source" },
            { width: COL.created, label: "Created" },
            { flex: 1, label: "Stages" },
          ]}
        />
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
        visibleRows.map((row, i) => {
          if (row.type === "header") {
            return (
              <Box
                key={`hdr-${row.label}`}
                paddingLeft={1}
                marginTop={i === 0 ? 0 : 1}
              >
                <Text bold color={theme.ui.heading}>
                  {"\u25B6"} {row.label}
                </Text>
                <Text dimColor> ({row.count})</Text>
              </Box>
            );
          }
          const { item: release, itemIndex } = row;
          const isSelected = isFocused && itemIndex === selectedIndex;
          return (
            <ReleaseRow
              key={release.id}
              release={release}
              isSelected={isSelected}
              width={innerWidth}
            />
          );
        })
      )}
    </Panel>
  );
});
