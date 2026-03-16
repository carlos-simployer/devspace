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

  // Sort: active projects (running/starting) first, then by original order
  const sortedProjects = [...projects].sort((a, b) => {
    const aActive =
      getProjectStatus(a.name) === "running" ||
      getProjectStatus(a.name) === "starting";
    const bActive =
      getProjectStatus(b.name) === "running" ||
      getProjectStatus(b.name) === "starting";
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  // Map sorted index back to original index for selection
  const sortedToOriginal = sortedProjects.map((sp) => projects.indexOf(sp));
  const originalToSorted = new Map<number, number>();
  sortedToOriginal.forEach((orig, sorted) =>
    originalToSorted.set(orig, sorted),
  );
  const sortedSelectedIndex = originalToSorted.get(selectedIndex) ?? 0;

  // Total items: projects + [+] Add
  const totalItems = sortedProjects.length + 1;

  // Viewport windowing
  let startIdx = 0;
  if (totalItems > height) {
    const halfView = Math.floor(height / 2);
    if (sortedSelectedIndex > halfView) {
      startIdx = Math.min(sortedSelectedIndex - halfView, totalItems - height);
    }
  }

  const visibleCount = Math.min(totalItems - startIdx, height);
  const innerWidth = width - 2; // padding

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderRight
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
    >
      {Array.from({ length: visibleCount }, (_, vi) => {
        const itemIdx = startIdx + vi;

        // [+] Add project at the end
        if (itemIdx === sortedProjects.length) {
          const isSelected = isFocused && selectedIndex === projects.length;
          const label = "[+] Add project".padEnd(innerWidth);
          return (
            <Box key="add-project">
              <Text
                inverse={isSelected}
                bold={isSelected}
                color={isSelected ? undefined : theme.status.info}
              >
                {" "}
                {label}
              </Text>
            </Box>
          );
        }

        const project = sortedProjects[itemIdx]!;
        const origIdx = sortedToOriginal[itemIdx]!;
        const isSelected = isFocused && origIdx === selectedIndex;
        const status = getProjectStatus(project.name);
        const { icon, color } = statusCircle(status);

        const nameStr = project.name.slice(0, innerWidth - 3);
        const label = `${icon} ${nameStr}`.padEnd(innerWidth);

        if (isSelected) {
          return (
            <Box key={project.name}>
              <Text inverse bold>
                {" "}
                {label}
              </Text>
            </Box>
          );
        }

        return (
          <Box key={project.name}>
            <Text>
              {" "}
              <Text color={color}>{icon}</Text> {nameStr}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
