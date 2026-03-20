import React from "react";
import type { PullRequest } from "../../api/types.ts";
import {
  getReviewStatus,
  getCIStatus,
  getMergeableStatus,
} from "../../utils/status.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";
import { TableRow } from "../../ui/table-row.tsx";

interface Props {
  pr: PullRequest;
  isSelected: boolean;
  width: number;
  hasNewActivity?: boolean;
}

export function PRRow({ pr, isSelected, width, hasNewActivity }: Props) {
  const review = getReviewStatus(pr);
  const ci = getCIStatus(pr);
  const merge = getMergeableStatus(pr);
  const updated = relativeTime(pr.updatedAt);
  const age = relativeTime(pr.createdAt);

  const draftPrefix = pr.isDraft ? "[DRAFT] " : "";
  const selector = isSelected ? "> " : hasNewActivity ? "\u25CF " : "  ";

  return (
    <TableRow
      selected={isSelected}
      width={width}
      columns={[
        {
          width: 2,
          content: selector,
          color: hasNewActivity ? getTheme().activity.dot : undefined,
          bold: hasNewActivity,
        },
        {
          width: 14,
          content: pr.repository.name,
          color: getTheme().list.repoName,
        },
        { width: 6, content: `#${pr.number}`, bold: true },
        { flex: 1, content: `${draftPrefix}${pr.title}`, dimColor: pr.isDraft },
        { width: 20, content: pr.author.name || pr.author.login },
        { width: 4, content: review.icon, color: review.color },
        { width: 4, content: ci.icon, color: ci.color },
        { width: 3, content: merge.icon, color: merge.color },
        { width: 7, content: age.text, dimColor: true },
        { width: 7, content: updated.text, bold: updated.isRecent },
      ]}
    />
  );
}
