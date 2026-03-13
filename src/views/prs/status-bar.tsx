import React from "react";
import { Box, Text } from "ink";
import type { FilterMode, PullRequest, SortMode } from "../../api/types.ts";
import { getReviewers, hexToAnsiColor } from "../../utils/reviewers.ts";

interface Props {
  filterMode: FilterMode;
  prCount: number;
  totalCount: number;
  lastRefresh: Date | null;
  secondsUntilRefresh: number;
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
  review: "To Review",
  closed: "Closed/Merged",
};

const SORT_LABELS: Record<SortMode, string> = {
  "repo-updated": "Repo+Updated",
  updated: "Most Recent",
  oldest: "Oldest First",
};

export function StatusBar({
  filterMode,
  prCount,
  totalCount,
  lastRefresh,
  secondsUntilRefresh,
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
      ? `Refresh in ${secondsUntilRefresh}s`
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
        </Box>
      )}
      {selectedPR && (
        <Box>
          <Text dimColor> Reviewers: </Text>
          {reviewers.length > 0 ? (
            reviewers.map((r, i) => {
              const color =
                r.state === "approved"
                  ? "green"
                  : r.state === "changes"
                    ? "red"
                    : r.state === "pending"
                      ? "yellow"
                      : undefined;
              const icon =
                r.state === "approved"
                  ? "✓"
                  : r.state === "changes"
                    ? "✗"
                    : r.state === "pending"
                      ? "◌"
                      : "●";
              return (
                <Text key={r.name}>
                  {i > 0 ? ", " : ""}
                  <Text color={color as any}>{icon}</Text> {r.name}
                </Text>
              );
            })
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
