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
  { key: "dependencies", label: "2 Deps" },
  { key: "pipelines", label: "3 Pipelines" },
  { key: "releases", label: "4 Releases" },
  { key: "config", label: "5 Config" },
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
      <Text dimColor> Tab/1-5: switch</Text>
    </Box>
  );
}

export { TABS };
