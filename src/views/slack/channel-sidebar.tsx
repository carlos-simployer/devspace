import React from "react";
import { Box, Text } from "ink";
import type { SlackChannel, SlackUser } from "../../api/types.ts";
import { getTheme } from "../../ui/theme.ts";
import { getUserDisplayName } from "../../utils/slack-format.ts";

interface Props {
  channels: SlackChannel[];
  selectedIndex: number;
  isFocused: boolean;
  width: number;
  selectedChannel: SlackChannel | null;
  userCache: Map<string, SlackUser>;
  presenceMap: Map<string, "active" | "away">;
}

export function ChannelSidebar({
  channels,
  selectedIndex,
  isFocused,
  width,
  selectedChannel,
  userCache,
  presenceMap,
}: Props) {
  const innerWidth = width - 2;

  const items = [
    ...channels.map((ch) => {
      const isDm = ch.is_im;
      let label: string;
      if (isDm && ch.user) {
        const name = getUserDisplayName(ch.user, userCache);
        const presence = presenceMap.get(ch.user);
        const dot = presence === "active" ? "\u25CF" : "\u25CB";
        label = `${dot} ${name}`;
      } else {
        const prefix = ch.is_private ? "\u{1F512}" : "#";
        const unread =
          ch.unread_count && ch.unread_count > 0 ? ` (${ch.unread_count})` : "";
        label = `${prefix} ${ch.name}${unread}`;
      }
      return { label, channelId: ch.id, isAdd: false };
    }),
    { label: "[+] Add channel", channelId: null as string | null, isAdd: true },
  ];

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderRight
      borderLeft={false}
      borderTop={false}
      borderBottom={false}
      paddingRight={1}
    >
      <Text bold dimColor={!isFocused}>
        Channels
      </Text>
      {items.map((item, i) => {
        const isActive = isFocused && i === selectedIndex;
        const isCurrent = !item.isAdd && item.channelId === selectedChannel?.id;
        const prefix = isCurrent && !item.isAdd ? "\u25CF " : "  ";
        const text = prefix + item.label;
        const padded = isActive ? text.padEnd(innerWidth) : text;
        const hasUnread =
          !item.isAdd && channels[i] && (channels[i]!.unread_count ?? 0) > 0;

        return (
          <Box key={(item.channelId ?? "add") + i}>
            <Text
              inverse={isActive}
              color={
                isActive
                  ? undefined
                  : item.isAdd
                    ? getTheme().list.addAction
                    : isCurrent
                      ? "white"
                      : undefined
              }
              bold={isActive || isCurrent || hasUnread}
              dimColor={!isFocused && !isCurrent && !isActive}
            >
              {padded}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
