import React from "react";
import type { AzurePipelineDefinition } from "../../api/types.ts";
import {
  getBuildStatusIcon,
  formatBranch,
  formatDuration,
  getBuildReasonLabel,
} from "../../utils/azure-status.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";
import { TableRow } from "../../ui/table-row.tsx";

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

  if (!build) {
    return (
      <TableRow
        selected={isSelected}
        width={width}
        columns={[
          { width: COL.selector, content: isSelected ? "> " : "  " },
          { width: COL.status, content: "— ", dimColor: true },
          { flex: 1, content: pipeline.name },
          { width: COL.buildNum, content: "No runs", dimColor: true },
          { width: COL.reason, content: "" },
          { width: COL.branch, content: "" },
          { width: COL.time, content: "" },
          { width: COL.duration, content: "" },
        ]}
      />
    );
  }

  const statusInfo = getBuildStatusIcon(build.status, build.result);

  let reasonText = getBuildReasonLabel(build.reason);
  if (build.reason === "pullRequest" && build.triggerInfo?.["pr.number"]) {
    reasonText += " #" + build.triggerInfo["pr.number"];
  }

  const branchText = formatBranch(build.sourceBranch);
  const timeText = build.queueTime ? relativeTime(build.queueTime).text : "";
  const durationText = formatDuration(build.startTime, build.finishTime);

  return (
    <TableRow
      selected={isSelected}
      width={width}
      columns={[
        { width: COL.selector, content: isSelected ? "> " : "  " },
        {
          width: COL.status,
          content: statusInfo.icon + " ",
          color: statusInfo.color,
        },
        { flex: 1, content: pipeline.name },
        { width: COL.buildNum, content: build.buildNumber ?? "", bold: true },
        { width: COL.reason, content: reasonText, dimColor: true },
        {
          width: COL.branch,
          content: branchText,
          color: getTheme().meta.branch,
        },
        { width: COL.time, content: timeText, dimColor: true },
        { width: COL.duration, content: durationText, dimColor: true },
      ]}
    />
  );
}
