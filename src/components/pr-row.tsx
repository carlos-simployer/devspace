import React from "react";
import { Box, Text } from "ink";
import type { PullRequest } from "../api/types.ts";
import { getReviewStatus, getCIStatus } from "../utils/status.ts";
import { relativeTime } from "../utils/time.ts";
import { COL, getTitleWidth } from "../utils/columns.ts";

interface Props {
  pr: PullRequest;
  isSelected: boolean;
  width: number;
}

export function PRRow({ pr, isSelected, width }: Props) {
  const review = getReviewStatus(pr);
  const ci = getCIStatus(pr);
  const updated = relativeTime(pr.updatedAt);
  const age = relativeTime(pr.createdAt);
  const titleWidth = getTitleWidth(width);

  const draftPrefix = pr.isDraft ? "[DRAFT] " : "";
  const fullTitle = `${draftPrefix}${pr.title}`;
  const truncTitle =
    fullTitle.length > titleWidth
      ? fullTitle.slice(0, titleWidth - 1) + "…"
      : fullTitle;

  const selector = (isSelected ? "> " : "  ").padEnd(COL.selector);
  const repo = pr.repository.name.slice(0, COL.repo - 1).padEnd(COL.repo);
  const num = `#${String(pr.number)}`.padEnd(COL.num);
  const title = truncTitle.padEnd(titleWidth);
  const author = pr.author.login.slice(0, COL.author - 1).padEnd(COL.author);
  const rv = review.icon.padEnd(COL.review);
  const ciText = ci.icon.padEnd(COL.ci);
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
      ageText +
      updatedText;
    return (
      <Box>
        <Text backgroundColor="blue" color="white">
          {line}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text>
        {selector}
        <Text dimColor>{repo}</Text>
        <Text color="cyan">{num}</Text>
        <Text dimColor={pr.isDraft}>{title}</Text>
        {author}
        <Text color={review.color as any}>{rv}</Text>
        <Text color={ci.color as any}>{ciText}</Text>
        <Text dimColor>{ageText}</Text>
        <Text bold={updated.isRecent}>{updatedText}</Text>
      </Text>
    </Box>
  );
}
