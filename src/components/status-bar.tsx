import React from "react";
import { Box, Text } from "ink";
import type { FilterMode, PullRequest, SortMode } from "../api/types.ts";
import { relativeTime } from "../utils/time.ts";

interface Props {
  filterMode: FilterMode;
  prCount: number;
  totalCount: number;
  lastRefresh: Date | null;
  loading: boolean;
  searchText: string;
  selectedPR: PullRequest | null;
  width: number;
  sortMode: SortMode;
  statusMessage: string;
  commentInput: string;
}

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "All PRs",
  mine: "My PRs",
  review: "Review requested",
  closed: "Closed/Merged",
};

const SORT_LABELS: Record<SortMode, string> = {
  "repo-updated": "Repo+Updated",
  updated: "Most Recent",
  oldest: "Oldest First",
};

function getReviewers(pr: PullRequest): string[] {
  const reviewers = new Set<string>();
  for (const review of pr.latestReviews.nodes) {
    if (review.author.login !== pr.author.login) {
      reviewers.add(review.author.login);
    }
  }
  return [...reviewers];
}

function hexToAnsiColor(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (r > g && r > b) return "red";
  if (g > r && g > b) return "green";
  if (b > r && b > g) return "blue";
  if (r > 200 && g > 200) return "yellow";
  if (r > 200 && b > 200) return "magenta";
  if (g > 200 && b > 200) return "cyan";
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness > 128) return "white";
  return "gray";
}

export function StatusBar({
  filterMode,
  prCount,
  totalCount,
  lastRefresh,
  loading,
  searchText,
  selectedPR,
  width,
  sortMode,
  statusMessage,
  commentInput,
}: Props) {
  const refreshText = loading
    ? "Refreshing..."
    : lastRefresh
      ? `Last refresh: ${relativeTime(lastRefresh.toISOString()).text} ago`
      : "";

  const reviewers = selectedPR ? getReviewers(selectedPR) : [];
  const labels = selectedPR?.labels?.nodes ?? [];

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      width={width}
    >
      <Box>
        <Text>
          <Text bold> Filter: {FILTER_LABELS[filterMode]} </Text>
          <Text dimColor>│</Text>
          <Text bold> Sort: {SORT_LABELS[sortMode]} </Text>
          <Text dimColor>│</Text>
          <Text>
            {" "}
            {prCount}
            {prCount !== totalCount ? `/${totalCount}` : ""} open{" "}
          </Text>
          <Text dimColor>│</Text>
          <Text dimColor> {refreshText} </Text>
          {searchText && (
            <>
              <Text dimColor>│</Text>
              <Text color="yellow"> Search: {searchText} </Text>
            </>
          )}
          {commentInput && (
            <>
              <Text dimColor>│</Text>
              <Text color="magenta"> Comment: {commentInput}▌ </Text>
            </>
          )}
          {statusMessage && (
            <>
              <Text dimColor>│</Text>
              <Text color="green"> {statusMessage} </Text>
            </>
          )}
        </Text>
      </Box>
      {selectedPR && (
        <Box>
          <Text dimColor> Branch: </Text>
          <Text color="cyan">{selectedPR.headRefName}</Text>
          <Text dimColor> │ </Text>
          <Text color="green">+{selectedPR.additions}</Text>
          <Text dimColor> </Text>
          <Text color="red">-{selectedPR.deletions}</Text>
          <Text dimColor> ({selectedPR.changedFiles} files)</Text>
          {selectedPR.mergeable === "CONFLICTING" && (
            <>
              <Text dimColor> │ </Text>
              <Text color="red" bold>
                Conflicts
              </Text>
            </>
          )}
          <Text dimColor> │ Reviewers: </Text>
          {reviewers.length > 0 ? (
            <Text>{reviewers.join(", ")}</Text>
          ) : (
            <Text dimColor>none</Text>
          )}
        </Box>
      )}
      {labels.length > 0 && (
        <Box>
          <Text dimColor> Labels: </Text>
          {labels.map((label, i) => (
            <Text key={label.name}>
              {i > 0 ? " " : ""}
              <Text color={hexToAnsiColor(label.color) as any}>
                {label.name}
              </Text>
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
