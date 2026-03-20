import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "./theme.ts";

export interface ScrollBarProps {
  /** Total number of items in the list */
  totalItems: number;
  /** Number of items visible in the viewport */
  visibleItems: number;
  /** Index of the first visible item (scroll offset) */
  scrollOffset: number;
  /** Height of the scroll bar track in terminal rows */
  height: number;
  /** Color override for the thumb (defaults to theme.ui.muted) */
  color?: string;
  /** Character for the thumb (default: "┃") */
  thumb?: string;
  /** Character for the track (default: "│") */
  track?: string;
}

/**
 * ScrollBar — renders a vertical scroll indicator.
 *
 * Shows a thin track with a proportional thumb that reflects the
 * current scroll position. Renders nothing when all items fit
 * in the viewport (no scrolling needed).
 */
export function ScrollBar({
  totalItems,
  visibleItems,
  scrollOffset,
  height,
  color,
  thumb = "\u2503",
  track = "\u2502",
}: ScrollBarProps) {
  const theme = getTheme();
  const thumbColor = color ?? theme.ui.muted;
  const trackColor = theme.ui.panelBorder;

  // Nothing to scroll
  if (totalItems <= visibleItems || height <= 0) {
    return null;
  }

  // Thumb size: proportional to visible / total, min 1 row
  const thumbSize = Math.max(
    1,
    Math.round((visibleItems / totalItems) * height),
  );

  // Thumb position: proportional to scroll offset
  const maxOffset = totalItems - visibleItems;
  const scrollRatio = maxOffset > 0 ? Math.min(scrollOffset / maxOffset, 1) : 0;
  const maxThumbPos = height - thumbSize;
  const thumbPos = Math.round(scrollRatio * maxThumbPos);

  const rows: React.ReactNode[] = [];
  for (let i = 0; i < height; i++) {
    const isThumb = i >= thumbPos && i < thumbPos + thumbSize;
    rows.push(
      <Text key={i} color={isThumb ? thumbColor : trackColor}>
        {isThumb ? thumb : track}
      </Text>,
    );
  }

  return (
    <Box flexDirection="column" width={1}>
      {rows}
    </Box>
  );
}
