import React from "react";
import { Box, Text } from "ink";
import type { LocalProject } from "../../api/types.ts";
import type { ProcessState } from "../../hooks/use-local-processes.ts";
import { getTheme, icons } from "../../ui/index.ts";

interface Props {
  projects: LocalProject[];
  states: Record<string, ProcessState>;
  selectedIndex: number;
  width: number;
  maxRows?: number;
}

function statusIcon(status: ProcessState["status"]): string {
  switch (status) {
    case "running":
      return icons.success;
    case "starting":
      return icons.pending;
    case "error":
      return icons.failure;
    case "stopped":
      return icons.none;
  }
}

function statusColor(status: ProcessState["status"]): string {
  const theme = getTheme();
  switch (status) {
    case "running":
      return theme.status.success;
    case "starting":
      return theme.status.pending;
    case "error":
      return theme.status.failure;
    case "stopped":
      return theme.status.muted;
  }
}

function formatUptime(startedAt?: number): string {
  if (!startedAt) return "";
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h${remainMin > 0 ? `${remainMin}m` : ""}`;
}

function extractPort(url?: string): string {
  if (!url) return "";
  const match = url.match(/:(\d+)/);
  return match ? `:${match[1]}` : "";
}

function pad(str: string, w: number): string {
  if (str.length >= w) return str.slice(0, w - 1) + "\u2026";
  return str.padEnd(w);
}

export function ProjectList({
  projects,
  states,
  selectedIndex,
  width,
  maxRows,
}: Props) {
  const theme = getTheme();

  if (projects.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>No projects configured. Press + to add one.</Text>
      </Box>
    );
  }

  // Column widths
  const SEL = 4; // "> X " or "  X "
  const nameW = Math.max(...projects.map((p) => p.name.length), 4) + 2;
  const pidW = 8;
  const upW = 7;
  const portW = 7;
  const fixedCols = SEL + nameW + pidW + upW + portW;
  const cmdW = Math.min(
    Math.max(...projects.map((p) => p.command.length), 7) + 2,
    Math.max(width - fixedCols - 15, 12),
    25,
  );

  // Build header
  const header =
    "".padEnd(SEL) +
    "Name".padEnd(nameW) +
    "Command".padEnd(cmdW) +
    "PID".padEnd(pidW) +
    "Uptime".padEnd(upW) +
    "Port".padEnd(portW) +
    "Info";

  return (
    <Box flexDirection="column" width={width}>
      <Box>
        <Text dimColor>{header}</Text>
      </Box>
      {(() => {
        // Viewport scrolling when maxRows is set
        const viewportSize = maxRows ?? projects.length;
        let startIdx = 0;
        if (projects.length > viewportSize) {
          const halfView = Math.floor(viewportSize / 2);
          if (selectedIndex > halfView) {
            startIdx = Math.min(
              selectedIndex - halfView,
              projects.length - viewportSize,
            );
          }
        }
        return projects
          .slice(startIdx, startIdx + viewportSize)
          .map((project, vi) => {
            const i = startIdx + vi;
            const isSelected = i === selectedIndex;
            const state = states[project.name] ?? {
              status: "stopped" as const,
              logs: [],
            };
            const icon = statusIcon(state.status);
            const color = statusColor(state.status);

            const pidStr = state.pid
              ? String(state.pid)
              : state.exitCode !== undefined && state.exitCode !== null
                ? `e:${state.exitCode}`
                : "";
            const upStr = state.startedAt
              ? "\u2191" + formatUptime(state.startedAt)
              : "";
            const portStr = extractPort(project.url);
            const depsStr =
              project.dependencies.length > 0
                ? `deps: ${project.dependencies.join(", ")}`
                : "";

            // Build each column with exact widths
            const sel = (isSelected ? "> " : "  ") + icon + " ";
            const name = pad(project.name, nameW);
            const cmd = pad(project.command, cmdW);
            const pid = pidStr.padEnd(pidW);
            const up = upStr.padEnd(upW);
            const port = portStr.padEnd(portW);

            // Selected: single inverse string, full width
            if (isSelected) {
              const content = sel + name + cmd + pid + up + port + depsStr;
              const line =
                content.length < width
                  ? content + " ".repeat(width - content.length)
                  : content;
              return (
                <Box key={project.name}>
                  <Text inverse bold>
                    {line}
                  </Text>
                </Box>
              );
            }

            // Not selected: colored segments, same widths
            return (
              <Box key={project.name}>
                <Text>
                  {"  "}
                  <Text color={color}>{icon}</Text> {name}
                  <Text color={theme.ui.muted}>{cmd}</Text>
                  <Text color={theme.ui.muted}>{pid}</Text>
                  <Text color={theme.status.success}>{up}</Text>
                  <Text color={theme.status.info}>{port}</Text>
                  <Text color={theme.ui.muted}>{depsStr}</Text>
                </Text>
              </Box>
            );
          });
      })()}
    </Box>
  );
}
