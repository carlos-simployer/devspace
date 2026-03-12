import React from "react";
import { Box, Text } from "ink";

interface Props {
  height: number;
  width: number;
  view?: "prs" | "dependencies";
}

const PR_SHORTCUTS = [
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
  ["Tab", "Switch to Dependency Tracker"],
  ["Esc", "Clear search / close overlay"],
  ["?", "Toggle this help"],
  ["q", "Quit"],
];

const DEP_SHORTCUTS = [
  ["↑/↓", "Navigate list"],
  ["←/→", "Switch packages / results"],
  ["Enter/o", "Open package.json in browser"],
  ["+", "Add package to track"],
  ["d/-", "Remove tracked package"],
  ["R", "Force refresh"],
  ["Tab", "Switch to PR Dashboard"],
  ["Esc", "Close overlay"],
  ["?", "Toggle this help"],
  ["q", "Quit"],
];

export function HelpOverlay({ height, width, view = "prs" }: Props) {
  const shortcuts = view === "dependencies" ? DEP_SHORTCUTS : PR_SHORTCUTS;
  const title =
    view === "dependencies"
      ? "Dependency Tracker Shortcuts"
      : "PR Dashboard Shortcuts";

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
          {title}
        </Text>
      </Box>
      {shortcuts.map(([key, desc]) => (
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
