import React from "react";
import { Box, Text } from "ink";
import type { AzureRelease } from "../../api/types.ts";
import { relativeTime } from "../../utils/time.ts";
import {
  getReleaseEnvStatusIcon,
  formatBranch,
} from "../../utils/azure-status.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  release: AzureRelease;
  isSelected: boolean;
  width: number;
}

const COL = {
  selector: 2,
  name: 18,
  created: 10,
} as const;

function getSourceWidth(totalWidth: number): number {
  // Reserve space for selector + name + created + some stage badges
  const fixed = COL.selector + COL.name + COL.created;
  return Math.max(20, Math.floor((totalWidth - fixed) * 0.5));
}

export function ReleaseRow({ release, isSelected, width }: Props) {
  const created = relativeTime(release.createdOn);
  const sourceWidth = getSourceWidth(width);

  // Build source from artifacts
  const artifact = release.artifacts[0];
  const version = artifact?.definitionReference?.version?.name ?? "";
  const rawBranch = artifact?.definitionReference?.branch?.name ?? "";
  const branch = rawBranch ? formatBranch(rawBranch) : "";
  const sourceText = branch ? `${version} ${branch}` : version;
  const truncSource =
    sourceText.length > sourceWidth - 1
      ? sourceText.slice(0, sourceWidth - 2) + "…"
      : sourceText;

  const releaseName = release.name.slice(0, COL.name - 1).padEnd(COL.name);
  const source = truncSource.padEnd(sourceWidth);
  const createdText = created.text.padEnd(COL.created);
  const selector = isSelected ? "> " : "  ";

  // Build stage badges text for the selected (inverse) rendering
  const stageParts = release.environments.map((env) => {
    const status = getReleaseEnvStatusIcon(env.status);
    return { name: env.name, color: status.color };
  });

  if (isSelected) {
    const stageStr = stageParts.map((s) => s.name).join("  ");
    const line = selector + releaseName + source + createdText + stageStr;
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
        <Text bold>{releaseName}</Text>
        <Text color={getTheme().meta.branch}>{source}</Text>
        <Text dimColor>{createdText}</Text>
        {stageParts.map((stage, i) => (
          <Text key={stage.name + i}>
            <Text color={stage.color as any}>{stage.name}</Text>
            {i < stageParts.length - 1 ? "  " : ""}
          </Text>
        ))}
      </Text>
    </Box>
  );
}
