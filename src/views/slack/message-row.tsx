import React from "react";
import { Box, Text } from "ink";
import type { SlackMessage, SlackUser } from "../../api/types.ts";
import { getTheme } from "../../ui/theme.ts";
import {
  formatSlackText,
  formatSlackTimestamp,
  getUserDisplayName,
} from "../../utils/slack-format.ts";

interface Props {
  message: SlackMessage;
  isSelected: boolean;
  isOwnMessage: boolean;
  width: number;
  userCache: Map<string, SlackUser>;
}

export function MessageRow({
  message,
  isSelected,
  isOwnMessage,
  width,
  userCache,
}: Props) {
  const theme = getTheme();
  const authorName = getUserDisplayName(message.user, userCache);
  const text = formatSlackText(message.text, userCache);
  const time = formatSlackTimestamp(message.ts);
  const hasThread = (message.reply_count ?? 0) > 0;
  const reactions = message.reactions ?? [];

  // Truncate message text to fit
  const nameWidth = Math.min(authorName.length, 16);
  const threadInfo = hasThread ? `[${message.reply_count} replies]` : "";
  const metaWidth = time.length + (threadInfo ? threadInfo.length + 1 : 0) + 2;
  const maxTextWidth = width - nameWidth - metaWidth - 6;
  const truncatedText =
    text.length > maxTextWidth
      ? text.slice(0, maxTextWidth - 1) + "\u2026"
      : text;

  // Single-line message text (no newlines)
  const singleLine = truncatedText.replace(/\n/g, " ");

  return (
    <Box flexDirection="column">
      <Box>
        <Text inverse={isSelected}>
          <Text bold={isSelected}>{isSelected ? "> " : "  "}</Text>
          <Text bold color={isOwnMessage ? theme.meta.branch : undefined}>
            {authorName.slice(0, 16).padEnd(nameWidth)}
          </Text>
          <Text> </Text>
          <Text>{singleLine}</Text>
          <Text>
            {"".padEnd(
              Math.max(
                0,
                width - nameWidth - singleLine.length - metaWidth - 4,
              ),
            )}
          </Text>
          {hasThread && <Text color={theme.ui.heading}>{threadInfo} </Text>}
          <Text dimColor>{time}</Text>
        </Text>
      </Box>
      {reactions.length > 0 && (
        <Box paddingLeft={nameWidth + 4}>
          {reactions.map((r) => (
            <Text key={r.name} dimColor>
              :{r.name}: {r.count}
              {"  "}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
