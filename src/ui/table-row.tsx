import React from "react";
import { Text } from "ink";

export interface Column {
  /** Fixed width in characters. Mutually exclusive with flex. */
  width?: number;
  /** Flex grow factor — fills remaining space. Only ONE column should have flex. */
  flex?: number;
  /** Content to display */
  content: string;
  /** Text color (applied in normal mode, not when selected) */
  color?: string;
  /** Bold text */
  bold?: boolean;
  /** Dim text */
  dimColor?: boolean;
  /** Align content: "left" (default) or "right" */
  align?: "left" | "right";
}

export interface TableRowProps {
  columns: Column[];
  /** Total row width */
  width: number;
  /** Whether this row is selected (renders with inverse+bold, no per-column colors) */
  selected?: boolean;
}

export interface TableHeaderProps {
  columns: Array<{
    width?: number;
    flex?: number;
    label: string;
    dimColor?: boolean;
  }>;
  width: number;
  bold?: boolean;
  dimColor?: boolean;
}

function computeWidths(
  columns: Array<{ width?: number; flex?: number }>,
  totalWidth: number,
): number[] {
  let fixedSum = 0;
  let flexTotal = 0;
  for (const col of columns) {
    if (col.width != null) {
      fixedSum += col.width;
    } else if (col.flex != null) {
      flexTotal += col.flex;
    }
  }
  const remaining = Math.max(0, totalWidth - fixedSum);
  return columns.map((col) => {
    if (col.width != null) return col.width;
    if (col.flex != null && flexTotal > 0) {
      return Math.floor((remaining * col.flex) / flexTotal);
    }
    return 0;
  });
}

function fitContent(
  content: string,
  colWidth: number,
  align: "left" | "right" = "left",
): string {
  if (colWidth <= 0) return "";
  if (content.length > colWidth) {
    if (colWidth <= 1) return content.slice(0, colWidth);
    return content.slice(0, colWidth - 1) + "\u2026";
  }
  return align === "right"
    ? content.padStart(colWidth)
    : content.padEnd(colWidth);
}

export function TableRow({
  columns,
  width,
  selected,
}: TableRowProps): React.ReactElement {
  const widths = computeWidths(columns, width);

  if (selected) {
    let line = "";
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]!;
      const w = widths[i]!;
      line += fitContent(col.content, w, col.align);
    }
    // Pad to total width, then truncate if somehow over
    line = line.padEnd(width).slice(0, width);
    return (
      <Text inverse bold>
        {line}
      </Text>
    );
  }

  return (
    <Text>
      {columns.map((col, i) => {
        const w = widths[i]!;
        const cell = fitContent(col.content, w, col.align);
        return (
          <Text
            key={i}
            color={col.color as any}
            bold={col.bold}
            dimColor={col.dimColor}
          >
            {cell}
          </Text>
        );
      })}
    </Text>
  );
}

export function TableHeader({
  columns,
  width,
  bold,
  dimColor,
}: TableHeaderProps): React.ReactElement {
  const widths = computeWidths(columns, width);

  return (
    <Text bold={bold} dimColor={dimColor}>
      {columns.map((col, i) => {
        const w = widths[i]!;
        const cell = col.label.padEnd(w).slice(0, w);
        return (
          <Text key={i} dimColor={col.dimColor}>
            {cell}
          </Text>
        );
      })}
    </Text>
  );
}
