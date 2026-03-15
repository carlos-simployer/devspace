import React from "react";
import { Box, Text } from "ink";
import { getTabViews } from "../ui/tabs.ts";
import { TabItem } from "../ui/tab-item.tsx";

const TABS = getTabViews();

interface Props {
  activeView: string;
}

export function TabBar({ activeView }: Props) {
  return (
    <Box>
      <Text bold color="cyan">
        devspace{" "}
      </Text>
      {TABS.map((tab) => (
        <TabItem
          key={tab.route}
          label={tab.label}
          isActive={tab.route === activeView}
        />
      ))}
      <Text dimColor> Tab/1-{TABS.length}: switch</Text>
    </Box>
  );
}
