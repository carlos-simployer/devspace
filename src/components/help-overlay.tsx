import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../ui/theme.ts";

interface Props {
  height: number;
  width: number;
  view?: "prs" | "dependencies" | "pipelines" | "releases";
}

const PR_SHORTCUTS = [
  ["↑/↓", "Navigate list"],
  ["←/→", "Switch sidebar / list"],
  ["Enter/o", "Open PR in browser"],
  ["p", "Open PR detail panel"],
  ["r", "Open repo in browser"],
  ["a", "Open Actions tab in browser"],
  ["y", "Copy PR URL to clipboard"],
  ["Y", "Copy branch name to clipboard"],
  ["m", "Filter: my PRs"],
  ["s", "Filter: review requested"],
  ["t", "Filter: all PRs (clear filter)"],
  ["c", "Filter: closed / merged"],
  ["S", "Cycle sort mode"],
  ["A", "Approve PR (two-step confirm)"],
  ["C", "Add comment to PR"],
  ["X", "Request changes on PR"],
  ["n", "Toggle notifications view"],
  ["+", "Add repo (search overlay)"],
  ["d", "Remove selected repo"],
  ["R", "Force refresh"],
  ["/", "Search/filter PRs"],
  ["Tab/1-5", "Switch view"],
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
  ["Tab/1-5", "Switch view"],
  ["Esc", "Close overlay"],
  ["?", "Toggle this help"],
  ["q", "Quit"],
];

const PIPELINE_SHORTCUTS = [
  ["↑/↓", "Navigate list"],
  ["←/→", "Switch sidebar / list"],
  ["Enter/p", "View pipeline runs"],
  ["o", "Open pipeline in browser"],
  ["+", "Add pipeline (search)"],
  ["d", "Remove pinned pipeline"],
  ["R", "Force refresh"],
  ["Tab/1-5", "Switch view"],
  ["Esc", "Close overlay"],
  ["?", "Toggle this help"],
  ["q", "Quit"],
];

const RELEASE_SHORTCUTS = [
  ["↑/↓", "Navigate list"],
  ["←/→", "Switch definitions / releases"],
  ["o", "Open release in browser"],
  ["+", "Add release definition"],
  ["d", "Remove definition"],
  ["R", "Force refresh"],
  ["Tab/1-5", "Switch view"],
  ["Esc", "Close overlay"],
  ["?", "Toggle this help"],
  ["q", "Quit"],
];

export function HelpOverlay({ height, width, view = "prs" }: Props) {
  const shortcuts =
    view === "dependencies"
      ? DEP_SHORTCUTS
      : view === "pipelines"
        ? PIPELINE_SHORTCUTS
        : view === "releases"
          ? RELEASE_SHORTCUTS
          : PR_SHORTCUTS;
  const title =
    view === "dependencies"
      ? "Dependency Tracker Shortcuts"
      : view === "pipelines"
        ? "Pipelines Shortcuts"
        : view === "releases"
          ? "Releases Shortcuts"
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
        <Text bold color={getTheme().ui.heading}>
          {title}
        </Text>
      </Box>
      {shortcuts.map(([key, desc]) => (
        <Box key={key}>
          <Text bold color={getTheme().ui.shortcutKey}>
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
