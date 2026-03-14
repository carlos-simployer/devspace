import React from "react";
import { Box } from "ink";
import type { DOMElement } from "ink";
import type { ViewId } from "../ui/view-config.ts";
import { getBaseView } from "../ui/view-config.ts";
import { getBarShortcuts } from "../ui/shortcut-registry.ts";
import { TabBar } from "./tab-bar.tsx";
import { Shortcuts } from "./shortcuts.tsx";

interface Props {
  view: ViewId;
  headerRef?: React.Ref<DOMElement>;
}

export function ViewHeader({ view, headerRef }: Props) {
  const baseView = getBaseView(view);
  const barItems = getBarShortcuts(view);

  // Fall back to base view bar if sub-view has no bar
  const items = barItems.length > 0 ? barItems : getBarShortcuts(baseView);

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
      <TabBar activeView={baseView} />
      {items.length > 0 && <Shortcuts items={items} />}
    </Box>
  );
}
