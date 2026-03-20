import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import {
  getBuildStatusIcon,
  formatBranch,
  formatDuration,
  getBuildReasonLabel,
} from "../../utils/azure-status.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { Panel } from "../../ui/panel.tsx";
import { TableHeader, TableRow } from "../../ui/table-row.tsx";
import { usePipelinesContext } from "./pipelines-context.ts";

const COL = {
  selector: 2,
  status: 4,
  buildNum: 14,
  message: 30,
  reason: 12,
  branch: 18,
  time: 8,
  duration: 10,
} as const;

function getMessageWidth(totalWidth: number): number {
  const fixed =
    COL.selector +
    COL.status +
    COL.buildNum +
    COL.reason +
    COL.branch +
    COL.time +
    COL.duration;
  return Math.max(16, totalWidth - fixed);
}

export function PipelineRuns() {
  const { config, contentHeight: height, width } = useAppContext();
  const { navigate } = useRouter();
  const {
    selectedPipeline,
    runs,
    runsLoading: loading,
    runsError: error,
  } = usePipelinesContext();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useRouteShortcuts({});

  const pipeline = selectedPipeline;
  const azureOrg = config.azureOrg;
  const azureProject = config.azureProject;

  // Panel borders (2) + title bar (1) + header row (1) + margin (1) + footer (1) = 6
  const panelHeight = height - 1; // leave room for footer
  const innerWidth = width - 4; // borders (2) + paddingX (2)
  const messageWidth = getMessageWidth(innerWidth);
  const listHeight = panelHeight - 2 - 2; // panel borders (2) + header+margin (2)

  useInput((input, key) => {
    if (key.escape) {
      navigate("pipelines");
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => {
        const next = Math.max(0, i - 1);
        if (next < scrollOffset) setScrollOffset(next);
        return next;
      });
    }
    if (key.downArrow) {
      setSelectedIndex((i) => {
        const next = Math.min(runs.length - 1, i + 1);
        if (next >= scrollOffset + listHeight) {
          setScrollOffset(next - listHeight + 1);
        }
        return next;
      });
    }
    if (key.return || input === "o") {
      const run = runs[selectedIndex];
      if (run) {
        const url = `https://dev.azure.com/${azureOrg}/${azureProject}/_build/results?buildId=${run.id}`;
        openInBrowser(url);
      }
    }
  });

  if (!pipeline) {
    return null;
  }

  const visible = runs.slice(scrollOffset, scrollOffset + listHeight);

  const count =
    runs.length > 0 ? `${selectedIndex + 1} of ${runs.length}` : undefined;

  const panelTitle = `${pipeline.name} \u2014 Run History`;

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Panel
        title={panelTitle}
        focused={true}
        width={width}
        height={panelHeight}
        count={count}
      >
        <Box marginBottom={1}>
          <TableHeader
            width={innerWidth}
            dimColor
            bold
            columns={[
              { width: COL.selector, label: "" },
              { width: COL.status, label: "St" },
              { width: COL.buildNum, label: "Build #" },
              { flex: 1, label: "Message" },
              { width: COL.reason, label: "Reason" },
              { width: COL.branch, label: "Branch" },
              { width: COL.time, label: "Time" },
              { width: COL.duration, label: "Duration" },
            ]}
          />
        </Box>

        {/* Content */}
        {loading ? (
          <Box paddingLeft={2} paddingTop={1}>
            <Spinner label="Loading runs..." />
          </Box>
        ) : error ? (
          <Box paddingLeft={2} paddingTop={1}>
            <Text color={getTheme().status.failure}>{error}</Text>
          </Box>
        ) : runs.length === 0 ? (
          <Box paddingLeft={2} paddingTop={1}>
            <Text dimColor>No runs found for this pipeline</Text>
          </Box>
        ) : (
          visible.map((run, i) => {
            const actualIndex = scrollOffset + i;
            const isSelected = actualIndex === selectedIndex;
            const statusInfo = getBuildStatusIcon(run.status, run.result);

            const requestedBy = run.requestedFor?.displayName ?? "";

            let reasonText = getBuildReasonLabel(run.reason);
            if (
              run.reason === "pullRequest" &&
              run.triggerInfo?.["pr.number"]
            ) {
              reasonText += " #" + run.triggerInfo["pr.number"];
            }

            const branchText = formatBranch(run.sourceBranch);
            const timeText = run.queueTime
              ? relativeTime(run.queueTime).text
              : "";
            const durationText = formatDuration(run.startTime, run.finishTime);

            return (
              <TableRow
                key={run.id}
                selected={isSelected}
                width={innerWidth}
                columns={[
                  {
                    width: COL.selector,
                    content: isSelected ? "> " : "  ",
                  },
                  {
                    width: COL.status,
                    content: statusInfo.icon + " ",
                    color: statusInfo.color,
                  },
                  {
                    width: COL.buildNum,
                    content: run.buildNumber ?? "",
                    bold: true,
                  },
                  { flex: 1, content: requestedBy },
                  {
                    width: COL.reason,
                    content: reasonText,
                    dimColor: true,
                  },
                  {
                    width: COL.branch,
                    content: branchText,
                    color: getTheme().meta.branch,
                  },
                  {
                    width: COL.time,
                    content: timeText,
                    dimColor: true,
                  },
                  {
                    width: COL.duration,
                    content: durationText,
                    dimColor: true,
                  },
                ]}
              />
            );
          })
        )}
      </Panel>

      {/* Footer */}
      <Text dimColor>
        {"  "}
        {"\u2191\u2193"}: navigate | Enter/o: open in browser | Esc: back
      </Text>
    </Box>
  );
}
