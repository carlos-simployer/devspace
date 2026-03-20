import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { PullRequest } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { PRRow } from "./pr-row.tsx";
import { TableHeader } from "../../ui/table-row.tsx";
import {
  groupByTimeBucket,
  flattenGroups,
  type FlatRow,
} from "../../utils/time-buckets.ts";

interface Props {
  prs: PullRequest[];
  selectedIndex: number;
  height: number;
  width: number;
  isFocused: boolean;
  searchText: string;
  loading: boolean;
  lastViewed: Record<string, number>;
}

export function PRList({
  prs,
  selectedIndex,
  height,
  width,
  isFocused,
  searchText,
  loading,
  lastViewed,
}: Props) {
  // Panel borders (2) + header (1) + margin (1) = 4
  const panelContentHeight = height - 2;
  const listHeight = panelContentHeight - 2;
  // Inner width = panel width minus borders (2) minus paddingX (2)
  const innerWidth = width - 4;

  // Filter by search text
  const filtered = searchText
    ? prs.filter(
        (pr) =>
          pr.title.toLowerCase().includes(searchText.toLowerCase()) ||
          pr.author.login.toLowerCase().includes(searchText.toLowerCase()) ||
          (pr.author.name ?? "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          pr.repository.name.toLowerCase().includes(searchText.toLowerCase()) ||
          String(pr.number).includes(searchText),
      )
    : prs;

  // Group by creation time bucket
  const groups = useMemo(() => groupByTimeBucket(filtered), [filtered]);
  const flatRows: FlatRow[] = useMemo(() => flattenGroups(groups), [groups]);

  // Find the flat-row index of the selected PR
  const selectedRowIdx = useMemo(() => {
    for (let i = 0; i < flatRows.length; i++) {
      const row = flatRows[i]!;
      if (row.type === "pr" && row.prIndex === selectedIndex) return i;
    }
    return 0;
  }, [flatRows, selectedIndex]);

  // Count visual lines (headers after the first add a blank margin line)
  const visualHeight = (rows: FlatRow[]) => {
    let lines = 0;
    let firstHeader = true;
    for (const r of rows) {
      if (r.type === "header" && !firstHeader) lines++; // marginTop
      if (r.type === "header") firstHeader = false;
      lines++;
    }
    return lines;
  };

  // Build visible rows from a given start index
  const buildVisible = (start: number): FlatRow[] => {
    const rows: FlatRow[] = [];
    let lines = 0;
    let seenHeader = false;
    for (let i = start; i < flatRows.length; i++) {
      const row = flatRows[i];
      if (!row) break;
      let needed = 1;
      if (row.type === "header" && seenHeader) needed = 2; // margin + row
      if (row.type === "header") seenHeader = true;
      if (lines + needed > listHeight) break;
      rows.push(row);
      lines += needed;
    }
    return rows;
  };

  // Viewport windowing on flat rows (headers + PRs)
  let startRow = 0;
  if (visualHeight(flatRows) > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedRowIdx > halfView) {
      startRow = Math.min(selectedRowIdx - halfView, flatRows.length - 1);
    }
  }

  let visibleRows = buildVisible(startRow);

  // Safety: if headers pushed the selected row out of the viewport, scroll to it
  const selectedVisible = visibleRows.some(
    (r) => r.type === "pr" && r.prIndex === selectedIndex,
  );
  if (!selectedVisible && flatRows.length > 0) {
    startRow = selectedRowIdx;
    visibleRows = buildVisible(startRow);
  }

  const count =
    filtered.length > 0
      ? `${Math.min(selectedIndex + 1, filtered.length)} of ${filtered.length}`
      : undefined;

  return (
    <Panel
      title="Pull Requests"
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
            { width: 2, label: "" },
            { width: 14, label: "Repo", dimColor: true },
            { width: 6, label: "PR#" },
            { flex: 1, label: "Title" },
            { width: 20, label: "Author" },
            { width: 4, label: "Rv" },
            { width: 4, label: "CI" },
            { width: 3, label: "Mg" },
            { width: 7, label: "Age" },
            { width: 7, label: "Updated" },
          ]}
        />
      </Box>
      {loading ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Spinner label="Loading pull requests..." />
        </Box>
      ) : filtered.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text dimColor>
            {searchText ? "No PRs match search" : "No open PRs found"}
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
                <Text bold>{row.label}</Text>
                <Text dimColor> ({row.count})</Text>
              </Box>
            );
          }
          const { pr, prIndex } = row;
          const viewedAt = lastViewed[pr.id];
          const hasNewActivity =
            viewedAt !== undefined &&
            new Date(pr.updatedAt).getTime() > viewedAt;
          return (
            <PRRow
              key={pr.id}
              pr={pr}
              isSelected={isFocused && prIndex === selectedIndex}
              width={innerWidth}
              hasNewActivity={hasNewActivity}
            />
          );
        })
      )}
    </Panel>
  );
}
