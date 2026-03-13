import React from "react";
import { Box, Text } from "ink";
import type { AppView } from "../api/types.ts";
import { TabItem } from "../ui/tab-item.tsx";

interface Tab {
  key: AppView;
  label: string;
}

const TABS: Tab[] = [
  { key: "prs", label: "1 PRs" },
  { key: "dependencies", label: "2 Dependencies" },
  { key: "config", label: "3 Config" },
];

interface Props {
  activeView: AppView;
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
      <Text dimColor> Tab/1-3: switch</Text>
    </Box>
  );
}

export { TABS };
