import React from "react";
import { Box, Text } from "ink";
import type { PullRequest } from "../../api/types.ts";
import {
  getReviewStatus,
  getCIStatus,
  getMergeableStatus,
} from "../../utils/status.ts";
import { relativeTime } from "../../utils/time.ts";
import { COL, getTitleWidth } from "../../utils/columns.ts";

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
  const titleWidth = getTitleWidth(width);

  const draftPrefix = pr.isDraft ? "[DRAFT] " : "";
  const fullTitle = `${draftPrefix}${pr.title}`;
  const truncTitle =
    fullTitle.length > titleWidth
      ? fullTitle.slice(0, titleWidth - 1) + "…"
      : fullTitle;

  const activityDot = hasNewActivity ? "●" : " ";
  const selector = (isSelected ? "> " : activityDot + " ").slice(
    0,
    COL.selector,
  );
  const repo = pr.repository.name.slice(0, COL.repo - 1).padEnd(COL.repo);
  const num = `#${String(pr.number)}`.padEnd(COL.num);
  const title = truncTitle.padEnd(titleWidth);
  const authorName = pr.author.name || pr.author.login;
  const author = authorName.slice(0, COL.author - 1).padEnd(COL.author);
  const rv = review.icon.padEnd(COL.review);
  const ciText = ci.icon.padEnd(COL.ci);
  const mgText = merge.icon.padEnd(COL.merge);
  const ageText = age.text.padEnd(COL.age);
  const updatedText = updated.text.padEnd(COL.updated);

  if (isSelected) {
    const line =
      selector +
      repo +
      num +
      title +
      author +
      rv +
      ciText +
      mgText +
      ageText +
      updatedText;
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
        <Text
          color={hasNewActivity ? "yellow" : undefined}
          bold={hasNewActivity}
        >
          {selector}
        </Text>
        <Text color="#6c7086">{repo}</Text>
        <Text bold>{num}</Text>
        <Text dimColor={pr.isDraft}>{title}</Text>
        {author}
        <Text color={review.color as any}>{rv}</Text>
        <Text color={ci.color as any}>{ciText}</Text>
        <Text color={merge.color as any}>{mgText}</Text>
        <Text dimColor>{ageText}</Text>
        <Text bold={updated.isRecent}>{updatedText}</Text>
      </Text>
    </Box>
  );
}
