import React from "react";
import { Box, Text } from "ink";
import type { DOMElement } from "ink";
import { getBarShortcuts } from "../ui/route-shortcuts.ts";
import { getBaseRoute } from "../ui/tabs.ts";
import { useRouter } from "../ui/router.ts";
import { Panel } from "../ui/panel.tsx";
import { APP_NAME } from "../constants.ts";
import { TabBar } from "./tab-bar.tsx";
import { Shortcuts } from "./shortcuts.tsx";

interface Props {
  route: string;
  width: number;
  headerRef?: React.Ref<DOMElement>;
}

export function ViewHeader({ route, width, headerRef }: Props) {
  const { matchedPath } = useRouter();
  const barItems = getBarShortcuts(route, matchedPath);
  const baseItems = getBarShortcuts(getBaseRoute(route), matchedPath);
  const items = barItems.length > 0 ? barItems : baseItems;

  const activeView = getBaseRoute(route);

  return (
    <Box ref={headerRef} flexDirection="column">
      <Panel title={APP_NAME} width={width} paddingX={1}>
        <TabBar activeView={activeView} />
        {items.length > 0 ? <Shortcuts items={items} /> : <Text> </Text>}
      </Panel>
    </Box>
  );
}
