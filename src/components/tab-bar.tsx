import React from "react";
import { Box, Text } from "ink";
import type { BaseView } from "../ui/view-config.ts";
import { getTabViews } from "../ui/view-config.ts";
import { TabItem } from "../ui/tab-item.tsx";

const TABS = getTabViews();

interface Props {
  activeView: BaseView | string;
}

export function TabBar({ activeView }: Props) {
  return (
    <Box>
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          label={tab.label}
          isActive={tab.key === activeView}
        />
      ))}
      <Text dimColor> Tab/1-{TABS.length}: switch</Text>
    </Box>
  );
}

export { TABS };
