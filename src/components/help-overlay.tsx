import React from "react";
import { Box, Text } from "ink";
import type { ViewId } from "../ui/view-config.ts";
import { getHelpShortcuts } from "../ui/shortcut-registry.ts";
import { getTheme } from "../ui/theme.ts";

interface Props {
  view: ViewId;
  height: number;
  width: number;
}

export function HelpOverlay({ view, height, width }: Props) {
  const shortcuts = getHelpShortcuts(view);
  const theme = getTheme();

  // Group: view-specific first, then globals
  const viewShortcuts = shortcuts.filter(([key]) => key !== "q" && key !== "?");
  const globalShortcuts = shortcuts.filter(
    ([key]) => key === "q" || key === "?",
  );

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color={theme.ui.heading}>
          Keyboard Shortcuts
        </Text>
      </Box>
      {viewShortcuts.map(([key, desc]) => (
        <Box key={key + desc}>
          <Text bold color={theme.ui.shortcutKey}>
            {"  "}
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
                {"  "}
                {key!.padEnd(12)}
              </Text>
              <Text>{desc}</Text>
            </Box>
          ))}
        </>
      )}
      <Box marginTop={1} justifyContent="center">
        <Text dimColor>Press ? to close</Text>
      </Box>
    </Box>
  );
}
