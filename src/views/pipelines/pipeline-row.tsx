import React from "react";
import { Box, Text } from "ink";
import type { AzurePipelineDefinition } from "../../api/types.ts";
import {
  getBuildStatusIcon,
  formatBranch,
  formatDuration,
  getBuildReasonLabel,
} from "../../utils/azure-status.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";

export const COL = {
  selector: 2,
  status: 4,
  name: 28,
  buildNum: 14,
  reason: 12,
  branch: 18,
  time: 8,
  duration: 10,
} as const;

export function getNameWidth(totalWidth: number): number {
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

interface Props {
  pipeline: AzurePipelineDefinition;
  isSelected: boolean;
  width: number;
}

export function PipelineRow({ pipeline, isSelected, width }: Props) {
  const build = pipeline.latestBuild;
  const nameWidth = getNameWidth(width);

  if (!build) {
    const selector = isSelected ? "> " : "  ";
    const name = pipeline.name.slice(0, nameWidth - 1).padEnd(nameWidth);
    const line = selector + "— ".padEnd(COL.status) + name + "No runs";

    if (isSelected) {
      return (
        <Box>
          <Text inverse bold>
            {line}
          </Text>
        </Box>
      );
    }

    return (
      <Box>
        <Text>
          {selector}
          <Text dimColor>{"— ".padEnd(COL.status)}</Text>
          <Text>{name}</Text>
          <Text dimColor>No runs</Text>
        </Text>
      </Box>
    );
  }

  const statusInfo = getBuildStatusIcon(build.status, build.result);
  const selector = isSelected ? "> " : "  ";
  const statusIcon = (statusInfo.icon + " ").padEnd(COL.status);
  const name = pipeline.name.slice(0, nameWidth - 1).padEnd(nameWidth);
  const buildNum = (build.buildNumber ?? "")
    .slice(0, COL.buildNum - 1)
    .padEnd(COL.buildNum);

  let reasonText = getBuildReasonLabel(build.reason);
  if (build.reason === "pullRequest" && build.triggerInfo?.["pr.number"]) {
    reasonText += " #" + build.triggerInfo["pr.number"];
  }
  const reason = reasonText.slice(0, COL.reason - 1).padEnd(COL.reason);

  const branch = formatBranch(build.sourceBranch)
    .slice(0, COL.branch - 1)
    .padEnd(COL.branch);
  const time = build.queueTime
    ? relativeTime(build.queueTime).text.padEnd(COL.time)
    : "".padEnd(COL.time);
  const duration = formatDuration(build.startTime, build.finishTime).padEnd(
    COL.duration,
  );

  if (isSelected) {
    const line =
      selector +
      statusIcon +
      name +
      buildNum +
      reason +
      branch +
      time +
      duration;
    return (
      <Box>
        <Text inverse bold>
          {line}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text>
        {selector}
        <Text color={statusInfo.color}>{statusIcon}</Text>
        <Text>{name}</Text>
        <Text bold>{buildNum}</Text>
        <Text dimColor>{reason}</Text>
        <Text color={getTheme().meta.branch}>{branch}</Text>
        <Text dimColor>{time}</Text>
        <Text dimColor>{duration}</Text>
      </Text>
    </Box>
  );
}
