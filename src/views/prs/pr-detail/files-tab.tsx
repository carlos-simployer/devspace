import React from "react";
import { Text } from "ink";
import type { PRFile } from "../../../hooks/use-pr-detail.ts";
import { getChangeTypeIcon } from "../../../utils/status.ts";
import { getTheme } from "../../../ui/theme.ts";
import { buildDiffLines } from "./diff-view.tsx";

type LineEntry = { key: string; node: React.ReactNode };

export function buildFilesLines(
  files: PRFile[],
  expandedFile: number | null,
  contentWidth: number,
): LineEntry[] {
  const lines: LineEntry[] = [];

  lines.push({
    key: "files-header",
    node: (
      <Text bold dimColor>
        Changed files ({files.length})
      </Text>
    ),
  });

  lines.push({ key: "files-spacer", node: <Text> </Text> });

  files.forEach((file, i) => {
    const { icon, color } = getChangeTypeIcon(file.changeType);
    const isExpanded = expandedFile === i;
    const arrow = isExpanded ? "▼" : "▶";

    lines.push({
      key: `file-${i}`,
      node: (
        <Text>
          <Text color={isExpanded ? getTheme().ui.heading : undefined}>
            {isExpanded ? "> " : "  "}
          </Text>
          <Text color={color as any}>{icon}</Text>
          {"  "}
          <Text bold={isExpanded}>{file.path}</Text>
          {"  "}
          <Text color={getTheme().diff.added}>+{file.additions}</Text>
          <Text dimColor> </Text>
          <Text color={getTheme().diff.removed}>-{file.deletions}</Text>
          {"  "}
          <Text dimColor>{arrow}</Text>
        </Text>
      ),
    });

    if (isExpanded && file.patch) {
      lines.push(...buildDiffLines(i, file.patch, contentWidth));
    } else if (isExpanded && !file.patch) {
      lines.push({
        key: `file-${i}-nopatch`,
        node: (
          <Text>
            {"    "}
            <Text dimColor>(binary file or no diff available)</Text>
          </Text>
        ),
      });
      lines.push({ key: `file-${i}-end`, node: <Text> </Text> });
    }
  });

  return lines;
}

/** Find the row index for a given file index in the flat lines array */
export function findFileRow(lines: LineEntry[], fileIdx: number): number {
  const key = `file-${fileIdx}`;
  return lines.findIndex((l) => l.key === key);
}
