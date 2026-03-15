import React from "react";
import { Box, Text } from "ink";
import type { BaseView } from "../ui/view-config.ts";
import { getTabViews as getTabViewsLegacy } from "../ui/view-config.ts";
import { getTabViews as getTabViewsNew } from "../ui/tabs.ts";
import { TabItem } from "../ui/tab-item.tsx";

// Use new tabs.ts as the source of truth; legacy kept for backward compat
const TABS_NEW = getTabViewsNew();
const TABS_LEGACY = getTabViewsLegacy();

interface Props {
  activeView: BaseView | string;
}

export function TabBar({ activeView }: Props) {
  // Try new route-based tabs first; they use "route" as the key field
  return (
    <Box>
      {TABS_NEW.map((tab) => (
        <TabItem
          key={tab.route}
          label={tab.label}
          isActive={tab.route === activeView}
        />
      ))}
      <Text dimColor> Tab/1-{TABS_NEW.length}: switch</Text>
    </Box>
  );
}

// Re-export legacy TABS for backward compatibility
const TABS = TABS_LEGACY;
export { TABS };
