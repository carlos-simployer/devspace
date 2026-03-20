import React from "react";
import { Box, Text } from "ink";
import { getHelpShortcuts } from "../ui/route-shortcuts.ts";
import { getTheme } from "../ui/theme.ts";
import { Dialog } from "../ui/dialog.tsx";
import { useRouter } from "../ui/router.ts";

interface Props {
  route: string;
  height: number;
  width: number;
}

export function HelpOverlay({ route, height, width }: Props) {
  const { matchedPath } = useRouter();
  const shortcuts = getHelpShortcuts(route, matchedPath);
  const theme = getTheme();

  // Group: view-specific first, then globals
  const viewShortcuts = shortcuts.filter(([key]) => key !== "q" && key !== "?");
  const globalShortcuts = shortcuts.filter(
    ([key]) => key === "q" || key === "?",
  );

  const totalLines = viewShortcuts.length + globalShortcuts.length + 5; // title + header + footer + margins
  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 2, totalLines);

  return (
    <Dialog
      title="Keyboard Shortcuts"
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
    </Dialog>
  );
}
