import React, { useSyncExternalStore } from "react";
import { Box, Text } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { Dialog } from "../../ui/dialog.tsx";
import { getTheme } from "../../ui/theme.ts";
import {
  getLogEntries,
  clearLog,
  subscribe,
  getSnapshot,
  type LogLevel,
} from "../../utils/logger.ts";

function levelColor(level: LogLevel): string | undefined {
  const theme = getTheme();
  switch (level) {
    case "error":
      return theme.status.failure;
    case "warn":
      return theme.status.pending;
    default:
      return undefined;
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function LogOverlayView() {
  const { height, width, onQuit } = useAppContext();

  // Subscribe to logger updates
  useSyncExternalStore(subscribe, getSnapshot);

  const entries = getLogEntries();
  const [scrollOffset, setScrollOffset] = React.useState(0);

  const boxWidth = Math.min(80, width - 4);
  const boxHeight = Math.min(height - 4, 30);
  const listHeight = boxHeight - 4; // title + footer + border

  // Auto-scroll to bottom when new entries arrive
  React.useEffect(() => {
    const maxOffset = Math.max(0, entries.length - listHeight);
    setScrollOffset(maxOffset);
  }, [entries.length, listHeight]);

  const visible = entries.slice(scrollOffset, scrollOffset + listHeight);

  useRouteShortcuts({
    quit: onQuit,
    up: () => setScrollOffset((o) => Math.max(0, o - 1)),
    down: () =>
      setScrollOffset((o) =>
        Math.min(Math.max(0, entries.length - listHeight), o + 1),
      ),
    clearLogs: () => {
      clearLog();
      setScrollOffset(0);
    },
  });

  return (
    <Dialog
      title="Logs"
      width={boxWidth}
      height={boxHeight}
      footer={
        <Text dimColor>
          {"\u2191\u2193"}: scroll | c: clear | L/esc: close | {entries.length}{" "}
          entries
        </Text>
      }
    >
      {entries.length === 0 ? (
        <Text dimColor>No log entries yet</Text>
      ) : (
        visible.map((entry, i) => (
          <Box key={scrollOffset + i}>
            <Text dimColor>{formatTime(entry.timestamp)} </Text>
            <Text color={levelColor(entry.level)} bold={entry.level !== "info"}>
              {entry.level.toUpperCase().padEnd(5)}{" "}
            </Text>
            <Text dimColor>[{entry.category}] </Text>
            <Text>{entry.message.slice(0, boxWidth - 30)}</Text>
          </Box>
        ))
      )}
    </Dialog>
  );
}
