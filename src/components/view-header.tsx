import React from "react";
import { Box } from "ink";
import type { DOMElement } from "ink";
import type { ViewId } from "../ui/view-config.ts";
import { getBaseView } from "../ui/view-config.ts";
import { getBarShortcuts as getBarShortcutsLegacy } from "../ui/shortcut-registry.ts";
import { getBarShortcuts as getBarShortcutsNew } from "../ui/route-shortcuts.ts";
import { getBaseRoute } from "../ui/tabs.ts";
import { TabBar } from "./tab-bar.tsx";
import { Shortcuts } from "./shortcuts.tsx";

interface Props {
  view: ViewId;
  /** Optional route override — when provided, uses the new route-based shortcuts */
  route?: string;
  headerRef?: React.Ref<DOMElement>;
}

export function ViewHeader({ view, route, headerRef }: Props) {
  let items: Array<{ key: string; label: string }>;

  if (route) {
    // New route-based system
    const barItems = getBarShortcutsNew(route);
    const baseItems = getBarShortcutsNew(getBaseRoute(route));
    items = barItems.length > 0 ? barItems : baseItems;
  } else {
    // Legacy view-based system
    const baseView = getBaseView(view);
    const barItems = getBarShortcutsLegacy(view);
    items = barItems.length > 0 ? barItems : getBarShortcutsLegacy(baseView);
  }

  const activeView = route ? getBaseRoute(route) : getBaseView(view);

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
