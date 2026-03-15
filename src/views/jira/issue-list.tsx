import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { JiraIssue } from "../../api/types.ts";
import { IssueRow, JIRA_COL, getIssueTitleWidth } from "./issue-row.tsx";
import {
  groupByStatus,
  getStatusColor,
  type StatusGroup,
} from "../../utils/jira-status.ts";

type FlatRow =
  | { type: "header"; status: string; category: string; count: number }
  | { type: "issue"; issue: JiraIssue; issueIndex: number };

function flattenGroups(groups: StatusGroup[]): FlatRow[] {
  const rows: FlatRow[] = [];
  let issueIndex = 0;
  for (const group of groups) {
    rows.push({
      type: "header",
      status: group.status,
      category: group.category,
      count: group.issues.length,
    });
    for (const issue of group.issues) {
      rows.push({ type: "issue", issue, issueIndex });
      issueIndex++;
    }
  }
  return rows;
}

interface Props {
  issues: JiraIssue[];
  statusOrder: string[];
  selectedIndex: number;
  height: number;
  width: number;
  searchText: string;
  loading: boolean;
}

export function IssueList({
  issues,
  statusOrder,
  selectedIndex,
  height,
  width,
  searchText,
  loading,
}: Props) {
  const listHeight = height - 2; // header + margin
  const titleWidth = getIssueTitleWidth(width);

  // Filter by search text on summary/key
  const filtered = searchText
    ? issues.filter(
        (issue) =>
          issue.fields.summary
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          issue.key.toLowerCase().includes(searchText.toLowerCase()),
      )
    : issues;

  // Group by status
  const groups = useMemo(
    () => groupByStatus(filtered, statusOrder),
    [filtered, statusOrder],
  );
  const flatRows: FlatRow[] = useMemo(() => flattenGroups(groups), [groups]);

  // Find the flat-row index of the selected issue
  const selectedRowIdx = useMemo(() => {
    for (let i = 0; i < flatRows.length; i++) {
      const row = flatRows[i]!;
      if (row.type === "issue" && row.issueIndex === selectedIndex) return i;
    }
    return 0;
  }, [flatRows, selectedIndex]);

  // Count visual lines (headers after the first add a blank margin line)
  const visualHeight = (rows: FlatRow[]) => {
    let lines = 0;
    let firstHeader = true;
    for (const r of rows) {
      if (r.type === "header" && !firstHeader) lines++;
      if (r.type === "header") firstHeader = false;
      lines++;
    }
    return lines;
  };

  // Viewport windowing on flat rows
  let startRow = 0;
  if (visualHeight(flatRows) > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedRowIdx > halfView) {
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
      if (row.type === "header" && seenHeader) needed = 2;
      if (row.type === "header") seenHeader = true;
      if (lines + needed > listHeight) break;
      visibleRows.push(row);
      lines += needed;
    }
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold dimColor>
          {"".padEnd(JIRA_COL.selector) +
            "Key".padEnd(JIRA_COL.key) +
            "Type".padEnd(JIRA_COL.type) +
            "Summary".padEnd(titleWidth) +
            "Assignee".padEnd(JIRA_COL.assignee) +
            "Priority".padEnd(JIRA_COL.priority) +
            "Updated".padEnd(JIRA_COL.updated)}
        </Text>
      </Box>
      {loading ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Spinner label="Loading Jira issues..." />
        </Box>
      ) : filtered.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text dimColor>
            {searchText ? "No issues match search" : "No issues found"}
          </Text>
        </Box>
      ) : (
        visibleRows.map((row, i) => {
          if (row.type === "header") {
            const statusColor = getStatusColor(row.category);
            return (
              <Box
                key={`hdr-${row.status}`}
                paddingLeft={1}
                marginTop={i === 0 ? 0 : 1}
              >
                <Text bold color={statusColor}>
                  {"\u25B6"} {row.status}
                </Text>
                <Text dimColor> ({row.count})</Text>
                {row.status === "Done" && (
                  <Text dimColor> {"\u2014"} last 20 shown</Text>
                )}
              </Box>
            );
          }
          const { issue, issueIndex } = row;
          return (
            <IssueRow
              key={issue.id}
              issue={issue}
              isSelected={issueIndex === selectedIndex}
              width={width}
            />
          );
        })
      )}
    </Box>
  );
}
