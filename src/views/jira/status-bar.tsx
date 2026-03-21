import React from "react";
import { Box, Text } from "ink";
import type { JiraFilterMode, JiraIssue } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  filterMode: JiraFilterMode;
  projectKey: string;
  issueCount: number;
  selectedIssue: JiraIssue | null;
  width: number;
  fetching: boolean;
  searchText: string | null;
  statusFilterActive: boolean;
  sortLabel: string;
  error: string | null;
}

const FILTER_LABELS: Record<JiraFilterMode, string> = {
  mine: "My Issues",
  team: "All Team",
  person: "Person",
};

export function JiraStatusBar({
  filterMode,
  projectKey,
  issueCount,
  selectedIssue,
  width,
  fetching,
  searchText,
  statusFilterActive,
  sortLabel,
  error,
}: Props) {
  const theme = getTheme();

  return (
    <Panel width={width} paddingX={0}>
      <Box>
        <Text wrap="truncate">
          <Text bold> Filter: {FILTER_LABELS[filterMode]} </Text>
          <Text dimColor>|</Text>
          <Text bold> {projectKey || "No project"} </Text>
          <Text dimColor>|</Text>
          <Text> {issueCount} issues </Text>
          <Text dimColor>|</Text>
          <Text> Sort: {sortLabel} </Text>
          {fetching && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.status.pending}> Refreshing... </Text>
            </>
          )}
          {statusFilterActive && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.input.search}> Status filtered </Text>
            </>
          )}
          {searchText !== null && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.input.search}> Search: /{searchText} </Text>
            </>
          )}
          {error && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.status.failure}> Error: {error} </Text>
            </>
          )}
        </Text>
      </Box>
      <Box>
        {selectedIssue ? (
          <Text wrap="truncate">
            <Text dimColor> </Text>
            <Text bold>{selectedIssue.key}</Text>
            <Text dimColor> | </Text>
            <Text>
              {selectedIssue.fields.assignee?.displayName ?? "Unassigned"}
            </Text>
            <Text dimColor> | </Text>
            <Text>{selectedIssue.fields.priority.name}</Text>
            {selectedIssue.fields.labels.length > 0 && (
              <>
                <Text dimColor> | </Text>
                <Text dimColor>{selectedIssue.fields.labels.join(", ")}</Text>
              </>
            )}
          </Text>
        ) : (
          <Text> </Text>
        )}
      </Box>
    </Panel>
  );
}
