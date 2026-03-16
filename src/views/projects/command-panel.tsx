import React from "react";
import { Box, Text } from "ink";
import type { LocalProject } from "../../api/types.ts";
import type { ProcessState } from "../../hooks/use-local-processes.ts";
import { processKey } from "../../hooks/use-local-processes.ts";
import { getTheme, icons } from "../../ui/index.ts";

interface Props {
  project: LocalProject;
  states: Record<string, ProcessState>;
  selectedCommandIndex: number;
  isFocused: boolean;
  height: number;
  width: number;
  logScrollOffset: number | null;
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

function pad(str: string, w: number): string {
  if (str.length >= w) return str.slice(0, w - 1) + "\u2026";
  return str.padEnd(w);
}

export function CommandPanel({
  project,
  states,
  selectedCommandIndex,
  isFocused,
  height,
  width,
  logScrollOffset,
}: Props) {
  const theme = getTheme();
  const commands = project.commands;

  // Layout: command table at top, logs below
  const tableHeight = Math.min(commands.length + 1, Math.floor(height * 0.4));
  const logHeight = height - tableHeight - 1; // -1 for log header

  // Column widths
  const nameW = Math.max(...commands.map((c) => c.name.length), 4) + 2;
  const selW = 4;
  const pidW = 8;
  const upW = 7;
  const cmdW = Math.min(
    Math.max(...commands.map((c) => c.command.length), 7) + 2,
    25,
  );
  const urlW =
    Math.max(...commands.map((c) => (c.url ? c.url.length + 1 : 0)), 0) > 0
      ? Math.min(
          Math.max(...commands.map((c) => (c.url?.length ?? 0) + 1), 4),
          25,
        )
      : 0;
  const fixedCols = selW + nameW + cmdW + pidW + upW + urlW;
  const pathW = Math.max(10, width - fixedCols - 2);

  const header =
    "".padEnd(selW) +
    "Name".padEnd(nameW) +
    "Command".padEnd(cmdW) +
    (urlW > 0 ? "URL".padEnd(urlW) : "") +
    "Path".padEnd(pathW) +
    "PID".padEnd(pidW) +
    "Uptime".padEnd(upW);

  // Selected command for logs
  const selectedCmd = commands[selectedCommandIndex];
  const selectedKey = selectedCmd
    ? processKey(project.name, selectedCmd.name)
    : "";
  const selectedState: ProcessState = selectedKey
    ? (states[selectedKey] ?? { status: "stopped", logs: [] })
    : { status: "stopped", logs: [] };

  // Log viewport
  const { logs } = selectedState;
  const maxOffset = Math.max(0, logs.length - logHeight);
  const effectiveOffset =
    logScrollOffset === null
      ? maxOffset
      : Math.max(0, Math.min(logScrollOffset, maxOffset));
  const visibleLogs = logs.slice(effectiveOffset, effectiveOffset + logHeight);
  const isAtBottom = effectiveOffset >= maxOffset;

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Command table */}
      <Box flexDirection="column" height={tableHeight}>
        <Box>
          <Text dimColor>{header}</Text>
        </Box>
        {commands.map((cmd, i) => {
          const key = processKey(project.name, cmd.name);
          const state = states[key] ?? { status: "stopped" as const, logs: [] };
          const isSelected = isFocused && i === selectedCommandIndex;
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

          const cwdPath = cmd.cwd || project.path;

          const urlStr = urlW > 0 ? (cmd.url ?? "").padEnd(urlW) : "";

          const sel = (isSelected ? "> " : "  ") + icon + " ";
          const name = pad(cmd.name, nameW);
          const cmdStr = pad(cmd.command, cmdW);
          const pathStr = pad(cwdPath, pathW);
          const pid = pidStr.padEnd(pidW);
          const up = upStr.padEnd(upW);

          if (isSelected) {
            const content = sel + name + cmdStr + urlStr + pathStr + pid + up;
            const line =
              content.length < width
                ? content + " ".repeat(width - content.length)
                : content;
            return (
              <Box key={key}>
                <Text inverse bold>
                  {line}
                </Text>
              </Box>
            );
          }

          return (
            <Box key={key}>
              <Text>
                {"  "}
                <Text color={color}>{icon}</Text> {name}
                <Text color={theme.ui.muted}>{cmdStr}</Text>
                {urlStr && <Text color={theme.status.info}>{urlStr}</Text>}
                <Text dimColor>{pathStr}</Text>
                <Text color={theme.ui.muted}>{pid}</Text>
                <Text color={theme.status.success}>{up}</Text>
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Log header */}
      <Box
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
        width={width}
      >
        <Text bold color={theme.ui.heading}>
          {selectedCmd?.name ?? ""}
        </Text>
        <Text color={theme.ui.muted}>
          {" "}
          {selectedState.status}
          {selectedState.pid ? ` pid:${selectedState.pid}` : ""}
          {" \u2502 "}
          {logs.length} lines
          {!isAtBottom ? ` \u2502 line ${effectiveOffset}/${maxOffset}` : ""}
        </Text>
        <Box flexGrow={1} />
        <Text dimColor>
          {"[ ] scroll \u2502 g/G top/bottom \u2502 c clear"}
        </Text>
      </Box>

      {/* Log content */}
      <Box flexDirection="column" paddingX={1} height={logHeight}>
        {visibleLogs.length === 0 ? (
          <Text dimColor>No output yet...</Text>
        ) : (
          visibleLogs.map((line, i) => (
            <Text key={effectiveOffset + i} wrap="truncate">
              {line.startsWith("[stderr]") ? (
                <Text color={theme.status.failure}>{line}</Text>
              ) : line.startsWith("[error]") ? (
                <Text color={theme.status.failure} bold>
                  {line}
                </Text>
              ) : line.startsWith("[exit]") ? (
                <Text color={theme.status.pending}>{line}</Text>
              ) : (
                line
              )}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}
