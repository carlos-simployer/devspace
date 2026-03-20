import React from "react";
import { Box, Text } from "ink";
import { Panel } from "./panel.tsx";
import { ScrollArea } from "./scroll-area.tsx";
import { TabItem } from "./tab-item.tsx";

export interface DetailTab {
  id: string;
  label: string;
}

export interface ContentLine {
  key: string;
  node: React.ReactNode;
}

export interface DetailPanelProps {
  tabs: DetailTab[];
  activeTab: string;
  lines: ContentLine[];
  scrollOffset: number;
  height: number;
  width: number;
  footer?: React.ReactNode;
}

export function DetailPanel({
  tabs,
  activeTab,
  lines,
  scrollOffset,
  height,
  width,
  footer,
}: DetailPanelProps) {
  const panelBorders = 2;
  const tabBarAndSeparator = 2;
  const footerHeight = footer ? 1 : 0;
  const viewportHeight =
    height - panelBorders - tabBarAndSeparator - footerHeight;

  // Panel inner width: width minus 2 borders minus 2 padding (paddingX=1)
  const contentWidth = width - 4;

  const actualOffset = Math.min(
    scrollOffset,
    Math.max(0, lines.length - viewportHeight),
  );
  const visibleLines = lines.slice(actualOffset, actualOffset + viewportHeight);

  return (
    <Panel focused={true} width={width} height={height}>
      {/* Tab bar */}
      <Box>
        {tabs.map((tab, i) => (
          <React.Fragment key={tab.id}>
            {i > 0 && <Text> </Text>}
            <TabItem label={tab.label} isActive={tab.id === activeTab} />
          </React.Fragment>
        ))}
      </Box>

      {/* Separator */}
      <Text dimColor>{"─".repeat(Math.max(0, contentWidth))}</Text>

      {/* Scrollable content */}
      <ScrollArea
        totalItems={lines.length}
        scrollOffset={actualOffset}
        height={viewportHeight}
      >
        {visibleLines.map((line) => (
          <Box key={line.key}>{line.node}</Box>
        ))}
      </ScrollArea>

      {/* Footer */}
      {footer && <Text dimColor>{footer}</Text>}
    </Panel>
  );
}
