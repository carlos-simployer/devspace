import React from "react";
import { Box } from "ink";
import type { DOMElement } from "ink";
import { getBarShortcuts } from "../ui/route-shortcuts.ts";
import { getBaseRoute } from "../ui/tabs.ts";
import { TabBar } from "./tab-bar.tsx";
import { Shortcuts } from "./shortcuts.tsx";

interface Props {
  route: string;
  headerRef?: React.Ref<DOMElement>;
}

export function ViewHeader({ route, headerRef }: Props) {
  const barItems = getBarShortcuts(route);
  const baseItems = getBarShortcuts(getBaseRoute(route));
  const items = barItems.length > 0 ? barItems : baseItems;

  const activeView = getBaseRoute(route);

  return (
    <Box
      ref={headerRef}
      flexDirection="column"
      paddingX={1}
      borderStyle="single"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderBottom
    >
      <TabBar activeView={activeView} />
      {items.length > 0 && <Shortcuts items={items} />}
    </Box>
  );
}
