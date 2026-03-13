import React from "react";
import { Box, Text } from "ink";
import type { AppView } from "../api/types.ts";

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
      {TABS.map((tab, i) => {
        const isActive = tab.key === activeView;
        return (
          <Box key={tab.key}>
            {i > 0 && <Text dimColor> </Text>}
            <Text
              backgroundColor={isActive ? "cyan" : undefined}
              color={isActive ? "black" : undefined}
              bold={isActive}
              dimColor={!isActive}
            >
              {` ${tab.label} `}
            </Text>
          </Box>
        );
      })}
      <Text dimColor> Tab/1-3: switch</Text>
    </Box>
  );
}

export { TABS };
