import React from "react";
import { Box, Text } from "ink";
import type { ViewId } from "../ui/view-config.ts";
import { getHelpShortcuts as getHelpShortcutsLegacy } from "../ui/shortcut-registry.ts";
import { getHelpShortcuts as getHelpShortcutsNew } from "../ui/route-shortcuts.ts";
import { getTheme } from "../ui/theme.ts";
import { Overlay } from "../ui/overlay.tsx";

interface Props {
  view: ViewId;
  /** Optional route override — when provided, uses the new route-based shortcuts */
  route?: string;
  height: number;
  width: number;
}

export function HelpOverlay({ view, route, height, width }: Props) {
  const shortcuts = route
    ? getHelpShortcutsNew(route)
    : getHelpShortcutsLegacy(view);
  const theme = getTheme();

  // Group: view-specific first, then globals
  const viewShortcuts = shortcuts.filter(([key]) => key !== "q" && key !== "?");
  const globalShortcuts = shortcuts.filter(
    ([key]) => key === "q" || key === "?",
  );

  const totalLines = viewShortcuts.length + globalShortcuts.length + 5; // title + header + footer + margins
  const boxWidth = Math.min(50, width - 4);
  const boxHeight = Math.min(height - 2, totalLines);

  return (
    <Box
      height={height}
      width={width}
      alignItems="center"
      justifyContent="center"
    >
      <Overlay
        title="Keyboard Shortcuts"
        titleColor={theme.ui.heading}
        width={boxWidth}
        height={boxHeight}
        footer={<Text dimColor>Press ? to close</Text>}
      >
        {viewShortcuts.map(([key, desc]) => (
          <Box key={key + desc}>
            <Text bold color={theme.ui.shortcutKey}>
              {key!.padEnd(12)}
            </Text>
            <Text>{desc}</Text>
          </Box>
        ))}
        {globalShortcuts.length > 0 && (
          <>
            <Box marginTop={1}>
              <Text bold color={theme.ui.heading}>
                Global
              </Text>
            </Box>
            {globalShortcuts.map(([key, desc]) => (
              <Box key={key + desc}>
                <Text bold color={theme.ui.shortcutKey}>
                  {key!.padEnd(12)}
                </Text>
                <Text>{desc}</Text>
              </Box>
            ))}
          </>
        )}
      </Overlay>
    </Box>
  );
}
