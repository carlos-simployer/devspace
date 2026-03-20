import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "./theme.ts";

export interface PanelProps {
  title?: string;
  focused?: boolean;
  borderColor?: string;
  width: number;
  height?: number;
  count?: string;
  merge?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
  paddingX?: number;
  children: React.ReactNode;
}

export function Panel({
  title,
  focused = false,
  borderColor,
  width,
  height,
  count,
  merge,
  paddingX = 1,
  children,
}: PanelProps) {
  const theme = getTheme();
  const color =
    borderColor ?? (focused ? theme.ui.focusBorder : theme.ui.panelBorder);

  const hasLeft = !merge?.left;
  const hasRight = !merge?.right;
  const borderCols = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);

  // -- Top border --
  const topLeft = merge?.top ? "├" : "╭";
  const topRight = merge?.top ? "┤" : "╮";

  let topMiddle: string;
  if (title) {
    const titleSegment = `─ ${title} `;
    const fillLen = width - borderCols - titleSegment.length;
    topMiddle = titleSegment + "─".repeat(Math.max(0, fillLen));
  } else {
    topMiddle = "─".repeat(width - borderCols);
  }

  const topLine =
    (hasLeft ? topLeft : "") + topMiddle + (hasRight ? topRight : "");

  // -- Bottom border --
  const botLeft = merge?.bottom ? "├" : "╰";
  const botRight = merge?.bottom ? "┤" : "╯";

  let botMiddle: string;
  if (count) {
    const countSegment = `─ ${count} ─`;
    const fillLen = width - borderCols - countSegment.length;
    botMiddle = "─".repeat(Math.max(0, fillLen)) + countSegment;
  } else {
    botMiddle = "─".repeat(width - borderCols);
  }

  const botLine =
    (hasLeft ? botLeft : "") + botMiddle + (hasRight ? botRight : "");

  const contentHeight = height !== undefined ? height - 2 : undefined;

  // Build a column of │ characters to fill the side borders
  const borderCol = (h: number | undefined) => {
    if (h === undefined) {
      // No fixed height — render a single │ and let flex handle it
      return (
        <Box flexDirection="column" width={1} flexGrow={1}>
          <Text color={color}>│</Text>
        </Box>
      );
    }
    const lines: React.ReactNode[] = [];
    for (let i = 0; i < h; i++) {
      lines.push(
        <Text key={i} color={color}>
          │
        </Text>,
      );
    }
    return (
      <Box flexDirection="column" width={1}>
        {lines}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={width}>
      <Text color={color}>{topLine}</Text>
      <Box flexDirection="row" height={contentHeight}>
        {hasLeft && borderCol(contentHeight)}
        <Box
          flexDirection="column"
          paddingLeft={paddingX}
          paddingRight={paddingX}
          flexGrow={1}
        >
          {children}
        </Box>
        {hasRight && borderCol(contentHeight)}
      </Box>
      <Text color={color}>{botLine}</Text>
    </Box>
  );
}
