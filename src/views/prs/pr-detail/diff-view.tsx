import React from "react";
import { Text } from "ink";
import { getTheme } from "../../../ui/theme.ts";

type LineEntry = { key: string; node: React.ReactNode };

/** Build diff lines for a single file's patch. */
export function buildDiffLines(
  fileIndex: number,
  patch: string,
  contentWidth: number,
): LineEntry[] {
  const lines: LineEntry[] = [];
  lines.push({ key: `file-${fileIndex}-sep`, node: <Text> </Text> });

  const patchLines = patch.split("\n");
  patchLines.forEach((patchLine, j) => {
    const truncated =
      patchLine.length > contentWidth - 4
        ? patchLine.slice(0, contentWidth - 5) + "…"
        : patchLine;

    let color: string | undefined;
    if (patchLine.startsWith("@@")) {
      color = getTheme().diff.hunk;
    } else if (patchLine.startsWith("+")) {
      color = getTheme().diff.added;
    } else if (patchLine.startsWith("-")) {
      color = getTheme().diff.removed;
    }

    lines.push({
      key: `file-${fileIndex}-patch-${j}`,
      node: (
        <Text>
          {"    "}
          <Text color={color as any}>{truncated}</Text>
        </Text>
      ),
    });
  });

  lines.push({
    key: `file-${fileIndex}-end`,
    node: <Text> </Text>,
  });
  return lines;
}
