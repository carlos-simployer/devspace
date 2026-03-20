import React from "react";
import { Box, Text } from "ink";
import { Panel } from "./panel.tsx";
import { ScrollArea } from "./scroll-area.tsx";
import { getTheme } from "./theme.ts";

export interface SidebarItem {
  key: string;
  label: string;
  prefix?: string;
  prefixColor?: string;
  isAdd?: boolean;
  isCurrent?: boolean;
  bold?: boolean;
}

export interface SidebarProps {
  title: string;
  items: SidebarItem[];
  selectedIndex: number;
  focused: boolean;
  width: number;
  height: number;
}

export function Sidebar({
  title,
  items,
  selectedIndex,
  focused,
  width,
  height,
}: SidebarProps) {
  const theme = getTheme();

  // Panel borders (2) + paddingX (2*1) = 4
  const innerWidth = width - 4;

  // Panel top/bottom borders take 2 rows
  const viewportHeight = Math.max(0, height - 2);

  // Centering algorithm from useListViewport
  let startIndex = 0;
  if (items.length > viewportHeight) {
    const halfView = Math.floor(viewportHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        items.length - viewportHeight,
      );
    }
  }

  const visibleItems = items.slice(startIndex, startIndex + viewportHeight);

  const count =
    items.length > 0 ? `${selectedIndex + 1} of ${items.length}` : undefined;

  return (
    <Panel
      title={title}
      focused={focused}
      width={width}
      height={height}
      count={count}
    >
      <ScrollArea
        totalItems={items.length}
        scrollOffset={startIndex}
        height={viewportHeight}
      >
        {visibleItems.map((item, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === selectedIndex;
          const prefix = item.prefix ?? "";
          const text = prefix + item.label;

          if (item.isAdd) {
            return (
              <Box key={item.key}>
                <Text color={theme.list.addAction} dimColor={!focused}>
                  {isSelected && focused ? text.padEnd(innerWidth) : text}
                </Text>
              </Box>
            );
          }

          if (isSelected && focused) {
            return (
              <Box key={item.key}>
                <Text inverse bold>
                  {text.padEnd(innerWidth)}
                </Text>
              </Box>
            );
          }

          if (item.isCurrent) {
            return (
              <Box key={item.key}>
                {item.prefix ? (
                  <>
                    <Text color={item.prefixColor} bold>
                      {item.prefix}
                    </Text>
                    <Text color="white" bold>
                      {item.label}
                    </Text>
                  </>
                ) : (
                  <Text color="white" bold>
                    {text}
                  </Text>
                )}
              </Box>
            );
          }

          return (
            <Box key={item.key}>
              {item.prefix ? (
                <>
                  <Text
                    color={item.prefixColor ?? undefined}
                    dimColor={!focused}
                    bold={item.bold}
                  >
                    {item.prefix}
                  </Text>
                  <Text dimColor={!focused} bold={item.bold}>
                    {item.label}
                  </Text>
                </>
              ) : (
                <Text dimColor={!focused} bold={item.bold}>
                  {text}
                </Text>
              )}
            </Box>
          );
        })}
      </ScrollArea>
    </Panel>
  );
}
