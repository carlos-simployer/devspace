import React from "react";
import { Box, Text } from "ink";
import type { FilterMode, PullRequest } from "../api/types.ts";
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
}

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "All PRs",
  mine: "My PRs",
  review: "Review requested",
  closed: "Closed/Merged",
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

export function StatusBar({
  filterMode,
  prCount,
  totalCount,
  lastRefresh,
  loading,
  searchText,
  selectedPR,
  width,
}: Props) {
  const refreshText = loading
    ? "Refreshing..."
    : lastRefresh
      ? `Last refresh: ${relativeTime(lastRefresh.toISOString()).text} ago`
      : "";

  const reviewers = selectedPR ? getReviewers(selectedPR) : [];

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
        </Text>
      </Box>
      {selectedPR && (
        <Box>
          <Text dimColor> Branch: </Text>
          <Text color="cyan">{selectedPR.headRefName}</Text>
          <Text dimColor> Reviewers: </Text>
          {reviewers.length > 0 ? (
            <Text>{reviewers.join(", ")}</Text>
          ) : (
            <Text dimColor>none</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
