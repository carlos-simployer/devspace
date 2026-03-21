import React from "react";
import { Box, Text } from "ink";
import type { SlackChannel } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { getTheme } from "../../ui/theme.ts";
import type { SlackInputMode } from "./slack-context.ts";

interface Props {
  channel: SlackChannel | null;
  messageCount: number;
  fetching: boolean;
  statusMessage: string;
  inputMode: SlackInputMode;
  inputText: string;
  width: number;
}

export function SlackStatusBar({
  channel,
  messageCount,
  fetching,
  statusMessage,
  inputMode,
  inputText,
  width,
}: Props) {
  const theme = getTheme();
  const channelName = channel
    ? channel.is_im
      ? "DM"
      : `#${channel.name}`
    : "No channel";

  return (
    <Panel width={width} paddingX={0}>
      <Box>
        <Text>
          <Text bold> {channelName} </Text>
          <Text dimColor>|</Text>
          <Text> {messageCount} messages </Text>
          {fetching && (
            <>
              <Text dimColor>|</Text>
              <Text dimColor> Refreshing... </Text>
            </>
          )}
          {inputMode !== "none" && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.input.comment}>
                {" "}
                {inputMode === "compose" ? "Message" : "Reply"}: {inputText}
                {"\u258C"}{" "}
              </Text>
            </>
          )}
          {statusMessage && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.status.success}> {statusMessage} </Text>
            </>
          )}
        </Text>
      </Box>
    </Panel>
  );
}
