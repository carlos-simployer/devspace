import React from "react";
import { Box, Text } from "ink";
import type { ProcessState } from "../../hooks/use-local-processes.ts";
import { getTheme } from "../../ui/index.ts";

interface Props {
  projectName: string;
  state: ProcessState;
  height: number;
  width: number;
  scrollOffset: number | null; // null = auto-follow bottom
}

export function LogPanel({
  projectName,
  state,
  height,
  width,
  scrollOffset,
}: Props) {
  const theme = getTheme();
  const headerHeight = 1;
  const logHeight = height - headerHeight;
  const { logs } = state;

  const maxOffset = Math.max(0, logs.length - logHeight);
  const effectiveOffset =
    scrollOffset === null
      ? maxOffset // auto-follow: show bottom
      : Math.max(0, Math.min(scrollOffset, maxOffset));
  const visibleLogs = logs.slice(effectiveOffset, effectiveOffset + logHeight);
  const isAtBottom = effectiveOffset >= maxOffset;

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header bar */}
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
          {projectName}
        </Text>
        <Text color={theme.ui.muted}>
          {" "}
          {state.status}
          {state.pid ? ` pid:${state.pid}` : ""}
          {" │ "}
          {logs.length} lines
          {!isAtBottom ? ` │ line ${effectiveOffset}/${maxOffset}` : ""}
        </Text>
        <Box flexGrow={1} />
        <Text dimColor>{"[ ] scroll │ g/G top/bottom │ c clear"}</Text>
      </Box>

      {/* Log content */}
      <Box flexDirection="column" paddingX={1}>
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
