import React from "react";
import { Box, Text } from "ink";
import type { PullRequest } from "../api/types.ts";
import { PRRow } from "./pr-row.tsx";
import { COL, getTitleWidth } from "../utils/columns.ts";

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
  // Header takes 1 line, leave room
  const listHeight = height - 1;
  const titleWidth = getTitleWidth(width);

  // Filter by search text
  const filtered = searchText
    ? prs.filter(
        (pr) =>
          pr.title.toLowerCase().includes(searchText.toLowerCase()) ||
          pr.author.login.toLowerCase().includes(searchText.toLowerCase()) ||
          pr.repository.name.toLowerCase().includes(searchText.toLowerCase()) ||
          String(pr.number).includes(searchText),
      )
    : prs;

  // Viewport windowing
  let startIndex = 0;
  if (filtered.length > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        filtered.length - listHeight,
      );
    }
  }
  const visiblePRs = filtered.slice(startIndex, startIndex + listHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
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
        visiblePRs.map((pr, i) => {
          const viewedAt = lastViewed[pr.id];
          const hasNewActivity =
            viewedAt !== undefined &&
            new Date(pr.updatedAt).getTime() > viewedAt;
          return (
            <PRRow
              key={pr.id}
              pr={pr}
              isSelected={isFocused && startIndex + i === selectedIndex}
              width={width}
              hasNewActivity={hasNewActivity}
            />
          );
        })
      )}
    </Box>
  );
}
