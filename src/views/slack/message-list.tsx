import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { SlackMessage, SlackUser } from "../../api/types.ts";
import { MessageRow } from "./message-row.tsx";

interface Props {
  messages: SlackMessage[];
  selectedIndex: number;
  height: number;
  width: number;
  isFocused: boolean;
  loading: boolean;
  currentUserId: string;
  userCache: Map<string, SlackUser>;
}

export function MessageList({
  messages,
  selectedIndex,
  height,
  width,
  isFocused,
  loading,
  currentUserId,
  userCache,
}: Props) {
  const listHeight = height - 1; // header

  // Viewport windowing — keep selected message visible
  // Count visual lines per message (1 for basic, 2 if has reactions)
  const rowHeights = messages.map((m) =>
    (m.reactions?.length ?? 0) > 0 ? 2 : 1,
  );

  let startIdx = 0;
  if (messages.length > 0) {
    // Sum lines from selected back to fill roughly half the view
    const halfView = Math.floor(listHeight / 2);
    let linesAbove = 0;
    let candidate = selectedIndex;
    while (candidate > 0 && linesAbove < halfView) {
      candidate--;
      linesAbove += rowHeights[candidate] ?? 1;
    }
    startIdx = Math.max(0, candidate);

    // Make sure we show enough lines to fill the view
    let totalLines = 0;
    let endIdx = startIdx;
    while (endIdx < messages.length && totalLines < listHeight) {
      totalLines += rowHeights[endIdx] ?? 1;
      endIdx++;
    }

    // Adjust start if we have room
    if (totalLines < listHeight && startIdx > 0) {
      while (startIdx > 0 && totalLines < listHeight) {
        startIdx--;
        totalLines += rowHeights[startIdx] ?? 1;
      }
    }
  }

  // Trim visible messages to fit
  const visibleMessages: SlackMessage[] = [];
  let linesUsed = 0;
  for (let i = startIdx; i < messages.length; i++) {
    const h = rowHeights[i] ?? 1;
    if (linesUsed + h > listHeight) break;
    visibleMessages.push(messages[i]!);
    linesUsed += h;
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={0}>
        <Text bold dimColor={!isFocused}>
          {"  "}Messages
        </Text>
        {messages.length > 0 && <Text dimColor> ({messages.length})</Text>}
      </Box>
      {loading ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Spinner label="Loading messages..." />
        </Box>
      ) : messages.length === 0 ? (
        <Box paddingLeft={2} paddingTop={1}>
          <Text dimColor>No messages</Text>
        </Box>
      ) : (
        visibleMessages.map((msg) => {
          const actualIdx = messages.indexOf(msg);
          return (
            <MessageRow
              key={msg.ts}
              message={msg}
              isSelected={isFocused && actualIdx === selectedIndex}
              isOwnMessage={msg.user === currentUserId}
              width={width}
              userCache={userCache}
            />
          );
        })
      )}
    </Box>
  );
}
