import React from "react";
import { Box, Text } from "ink";
import type { LocalProject } from "../../api/types.ts";
import type { ProcessStatus } from "../../hooks/use-local-processes.ts";
import { getTheme } from "../../ui/index.ts";

interface Props {
  projects: LocalProject[];
  selectedIndex: number;
  isFocused: boolean;
  height: number;
  width: number;
  getProjectStatus: (name: string) => ProcessStatus;
}

function statusCircle(status: ProcessStatus): { icon: string; color: string } {
  const theme = getTheme();
  switch (status) {
    case "running":
      return { icon: "\u25CF", color: theme.status.success };
    case "partial":
      return { icon: "\u25D0", color: theme.status.pending };
    case "starting":
      return { icon: "\u25CF", color: theme.status.pending };
    case "error":
      return { icon: "\u25CF", color: theme.status.failure };
    case "stopped":
      return { icon: "\u25CB", color: theme.status.muted };
  }
}

export function ProjectSidebar({
  projects,
  selectedIndex,
  isFocused,
  height,
  width,
  getProjectStatus,
}: Props) {
  const theme = getTheme();

  // Total items: projects + [+] Add
  const totalItems = projects.length + 1;

  // Viewport windowing
  let startIdx = 0;
  if (totalItems > height) {
    const halfView = Math.floor(height / 2);
    if (selectedIndex > halfView) {
      startIdx = Math.min(selectedIndex - halfView, totalItems - height);
    }
  }

  const visibleCount = Math.min(totalItems - startIdx, height);
  const innerWidth = width;

  return (
    <Box flexDirection="column">
      {Array.from({ length: visibleCount }, (_, vi) => {
        const itemIdx = startIdx + vi;

        // [+] Add project at the end
        if (itemIdx === projects.length) {
          const isSelected = isFocused && selectedIndex === projects.length;
          const label = "[+] Add project";
          const padded = isSelected ? label.padEnd(innerWidth) : label;
          return (
            <Box key="add-project">
              <Text
                inverse={isSelected}
                bold={isSelected}
                color={isSelected ? undefined : theme.list.addAction}
                dimColor={!isFocused && !isSelected}
              >
                {padded}
              </Text>
            </Box>
          );
        }

        const project = projects[itemIdx]!;
        const isSelected = isFocused && itemIdx === selectedIndex;
        const status = getProjectStatus(project.name);
        const { icon, color } = statusCircle(status);

        const nameStr = project.name.slice(0, innerWidth - 3);
        const label = `${icon} ${nameStr}`;

        if (isSelected) {
          return (
            <Box key={project.name}>
              <Text inverse bold>
                {label.padEnd(innerWidth)}
              </Text>
            </Box>
          );
        }

        return (
          <Box key={project.name}>
            <Text dimColor={!isFocused}>
              <Text color={color}>{icon}</Text> {nameStr}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
