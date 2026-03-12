import React from "react";
import { Box, Text } from "ink";

interface Props {
  height: number;
  width: number;
}

const SHORTCUTS = [
  ["↑/↓", "Navigate list"],
  ["←/→", "Switch sidebar / list"],
  ["Enter/o", "Open PR in browser"],
  ["r", "Open repo in browser"],
  ["a", "Open Actions tab in browser"],
  ["m", "Filter: my PRs"],
  ["s", "Filter: review requested"],
  ["t", "Filter: all PRs (clear filter)"],
  ["+", "Add repo (search overlay)"],
  ["d", "Remove selected repo"],
  ["R", "Force refresh"],
  ["/", "Search/filter PRs"],
  ["Esc", "Clear search / close overlay"],
  ["?", "Toggle this help"],
  ["q", "Quit"],
];

export function HelpOverlay({ height, width }: Props) {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          Keyboard Shortcuts
        </Text>
      </Box>
      {SHORTCUTS.map(([key, desc]) => (
        <Box key={key}>
          <Text bold color="yellow">
            {"  "}
            {key!.padEnd(12)}
          </Text>
          <Text>{desc}</Text>
        </Box>
      ))}
      <Box marginTop={1} justifyContent="center">
        <Text dimColor>Press ? to close</Text>
      </Box>
    </Box>
  );
}
