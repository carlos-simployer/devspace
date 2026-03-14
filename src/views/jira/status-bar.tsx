import React from "react";
import { Box, Text } from "ink";
import type { JiraFilterMode, JiraIssue } from "../../api/types.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  filterMode: JiraFilterMode;
  projectKey: string;
  issueCount: number;
  selectedIssue: JiraIssue | null;
  width: number;
  fetching: boolean;
  searchText: string;
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
  error,
}: Props) {
  const theme = getTheme();

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
          <Text dimColor>|</Text>
          <Text bold> {projectKey || "No project"} </Text>
          <Text dimColor>|</Text>
          <Text> {issueCount} issues </Text>
          {fetching && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.status.pending}> Refreshing... </Text>
            </>
          )}
          {searchText && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.input.search}> Search: {searchText} </Text>
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
      {selectedIssue && (
        <Box>
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
        </Box>
      )}
    </Box>
  );
}
