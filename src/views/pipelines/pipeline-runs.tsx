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
  return Math.max(16, totalWidth - fixed - 4); // -4 for padding
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

  const contentWidth = width - 4;
  const messageWidth = getMessageWidth(contentWidth);
  const headerLines = 3; // title + column header + separator
  const footerLines = 1;
  const listHeight = height - headerLines - footerLines - 2; // -2 for padding

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

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
      paddingY={1}
    >
      {/* Title */}
      <Box>
        <Text bold color={getTheme().ui.heading}>
          {pipeline.name}
        </Text>
        <Text dimColor> {"\u2014"} Run History</Text>
      </Box>

      {/* Column header */}
      <Box marginBottom={0}>
        <Text bold dimColor>
          {"".padEnd(COL.selector)}
          {"St".padEnd(COL.status)}
          {"Build #".padEnd(COL.buildNum)}
          {"Message".padEnd(messageWidth)}
          {"Reason".padEnd(COL.reason)}
          {"Branch".padEnd(COL.branch)}
          {"Time".padEnd(COL.time)}
          {"Duration".padEnd(COL.duration)}
        </Text>
      </Box>
      <Text dimColor>{"\u2500".repeat(contentWidth)}</Text>

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

          const selector = isSelected ? "> " : "  ";
          const statusIcon = (statusInfo.icon + " ").padEnd(COL.status);
          const buildNum = (run.buildNumber ?? "")
            .slice(0, COL.buildNum - 1)
            .padEnd(COL.buildNum);

          const requestedBy = run.requestedFor?.displayName ?? "";
          const msg = requestedBy
            .slice(0, messageWidth - 1)
            .padEnd(messageWidth);

          let reasonText = getBuildReasonLabel(run.reason);
          if (run.reason === "pullRequest" && run.triggerInfo?.["pr.number"]) {
            reasonText += " #" + run.triggerInfo["pr.number"];
          }
          const reason = reasonText.slice(0, COL.reason - 1).padEnd(COL.reason);

          const branch = formatBranch(run.sourceBranch)
            .slice(0, COL.branch - 1)
            .padEnd(COL.branch);
          const time = run.queueTime
            ? relativeTime(run.queueTime).text.padEnd(COL.time)
            : "".padEnd(COL.time);
          const duration = formatDuration(run.startTime, run.finishTime).padEnd(
            COL.duration,
          );

          if (isSelected) {
            const line =
              selector +
              statusIcon +
              buildNum +
              msg +
              reason +
              branch +
              time +
              duration;
            return (
              <Box key={run.id}>
                <Text inverse bold>
                  {line}
                </Text>
              </Box>
            );
          }

          return (
            <Box key={run.id}>
              <Text>
                {selector}
                <Text color={statusInfo.color}>{statusIcon}</Text>
                <Text bold>{buildNum}</Text>
                <Text>{msg}</Text>
                <Text dimColor>{reason}</Text>
                <Text color={getTheme().meta.branch}>{branch}</Text>
                <Text dimColor>{time}</Text>
                <Text dimColor>{duration}</Text>
              </Text>
            </Box>
          );
        })
      )}

      {/* Footer */}
      <Box position="absolute" marginTop={height - 2} marginLeft={2}>
        <Text dimColor>
          {"\u2191\u2193"}: navigate | Enter/o: open in browser | Esc: back
        </Text>
      </Box>
    </Box>
  );
}
