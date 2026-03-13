import React, { useMemo } from "react";
import { Box, Text } from "ink";
import type { PullRequest } from "../api/types.ts";
import { PRRow } from "./pr-row.tsx";
import { COL, getTitleWidth } from "../utils/columns.ts";
import {
  groupByTimeBucket,
  flattenGroups,
  type FlatRow,
} from "../utils/time-buckets.ts";

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
  // Header takes 1 line + 1 margin line, leave room
  const listHeight = height - 2;
  const titleWidth = getTitleWidth(width);

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

  // Viewport windowing on flat rows (headers + PRs)
  let startRow = 0;
  if (visualHeight(flatRows) > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedRowIdx > halfView) {
      // Binary search for the right start so visual lines fit
      let candidate = Math.min(selectedRowIdx - halfView, flatRows.length - 1);
      while (
        candidate > 0 &&
        visualHeight(flatRows.slice(candidate)) > listHeight
      ) {
        candidate++;
      }
      startRow = candidate;
    }
  }

  // Trim visible rows to fit listHeight visual lines
  const visibleRows: FlatRow[] = [];
  {
    let lines = 0;
    let seenHeader = false;
    for (let i = startRow; i < flatRows.length; i++) {
      const row = flatRows[i]!;
      let needed = 1;
      if (row.type === "header" && seenHeader) needed = 2; // margin + row
      if (row.type === "header") seenHeader = true;
      if (lines + needed > listHeight) break;
      visibleRows.push(row);
      lines += needed;
    }
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold dimColor={!isFocused}>
          {"".padEnd(COL.selector)}
          <Text dimColor>{"Repo".padEnd(COL.repo)}</Text>
          {"PR#".padEnd(COL.num)}
          {"Title".padEnd(titleWidth)}
          {"Author".padEnd(COL.author)}
          {"Rv".padEnd(COL.review)}
          {"CI".padEnd(COL.ci)}
          {"Mg".padEnd(COL.merge)}
          {"Age".padEnd(COL.age)}
          {"Updated".padEnd(COL.updated)}
        </Text>
      </Box>
      {loading ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text color="yellow">Loading pull requests...</Text>
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
                <Text bold color="green">
                  {row.label}
                </Text>
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
              width={width}
              hasNewActivity={hasNewActivity}
            />
          );
        })
      )}
    </Box>
  );
}
