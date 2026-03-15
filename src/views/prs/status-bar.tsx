import React from "react";
import { Box, Text } from "ink";
import type { FilterMode, PullRequest, SortMode } from "../../api/types.ts";
import { getReviewers, hexToAnsiColor } from "../../utils/reviewers.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  filterMode: FilterMode;
  prCount: number;
  totalCount: number;
  lastRefresh: Date | null;
  secondsUntilRefresh: number;
  fetching: boolean;
  searchText: string | null;
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
  fetching,
  searchText,
  selectedPR,
  width,
  sortMode,
  statusMessage,
  commentInput,
}: Props) {
  const refreshText = fetching
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
          {searchText !== null && (
            <>
              <Text dimColor>│</Text>
              <Text color={getTheme().input.search}>
                {" "}
                Search: /{searchText}
              </Text>
            </>
          )}
          {commentInput && (
            <>
              <Text dimColor>│</Text>
              <Text color={getTheme().input.comment}>
                {" "}
                Comment: {commentInput}▌{" "}
              </Text>
            </>
          )}
          {statusMessage && (
            <>
              <Text dimColor>│</Text>
              <Text color={getTheme().status.success}> {statusMessage} </Text>
            </>
          )}
        </Text>
      </Box>
      {selectedPR && (
        <Box>
          <Text dimColor> Branch: </Text>
          <Text color={getTheme().meta.branch}>{selectedPR.headRefName}</Text>
          <Text dimColor> │ </Text>
          <Text color={getTheme().diff.added}>+{selectedPR.additions}</Text>
          <Text dimColor> </Text>
          <Text color={getTheme().diff.removed}>-{selectedPR.deletions}</Text>
          <Text dimColor> ({selectedPR.changedFiles} files)</Text>
          {selectedPR.mergeable === "CONFLICTING" && (
            <>
              <Text dimColor> │ </Text>
              <Text color={getTheme().status.failure} bold>
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
                  ? getTheme().status.success
                  : r.state === "changes"
                    ? getTheme().status.failure
                    : r.state === "pending"
                      ? getTheme().status.pending
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
