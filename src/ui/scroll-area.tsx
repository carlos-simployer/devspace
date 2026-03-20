import React from "react";
import { Box } from "ink";
import { ScrollBar } from "./scroll-bar.tsx";

export interface ScrollAreaProps {
  /** Total number of items (rows) in the scrollable content */
  totalItems: number;
  /** Index of the first visible item (scroll offset / start index) */
  scrollOffset: number;
  /** Height of the viewport in terminal rows */
  height: number;
  /** Whether to show the scroll bar indicator (default: true) */
  showScrollBar?: boolean;
  /** Color override for the scroll bar thumb */
  scrollBarColor?: string;
  /** The visible content to render inside the scroll area */
  children: React.ReactNode;
}

/**
 * ScrollArea — a container that pairs visible content with a ScrollBar.
 *
 * This component does NOT perform windowing/slicing of children; the caller
 * is responsible for passing only the visible items as children. ScrollArea
 * adds a scroll bar indicator alongside the content when the total items
 * exceed the viewport height.
 *
 * Usage:
 * ```tsx
 * const visible = items.slice(startIndex, startIndex + viewportHeight);
 * <ScrollArea totalItems={items.length} scrollOffset={startIndex} height={viewportHeight}>
 *   {visible.map(item => <ItemRow key={item.id} ... />)}
 * </ScrollArea>
 * ```
 */
export function ScrollArea({
  totalItems,
  scrollOffset,
  height,
  showScrollBar = true,
  scrollBarColor,
  children,
}: ScrollAreaProps) {
  const needsScrollBar = showScrollBar && totalItems > height;

  return (
    <Box flexDirection="row" height={height}>
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
      {needsScrollBar && (
        <ScrollBar
          totalItems={totalItems}
          visibleItems={height}
          scrollOffset={scrollOffset}
          height={height}
          color={scrollBarColor}
        />
      )}
    </Box>
  );
}
