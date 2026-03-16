import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../../ui/theme.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useSlackContext } from "./slack-context.ts";

const EMOJIS = [
  ["thumbsup", "thumbsdown", "heart", "eyes"],
  ["tada", "rocket", "fire", "100"],
  ["white_check_mark", "raised_hands", "thinking_face", "joy"],
];

const COLS = EMOJIS[0]!.length;
const ROWS = EMOJIS.length;

export function SlackEmojiPicker() {
  const { width } = useAppContext();
  const { navigate } = useRouter();
  const { selectedChannel, selectedMessage, mutations, showStatus } =
    useSlackContext();

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);

  const selectedEmoji = EMOJIS[row]?.[col] ?? "thumbsup";

  useInput((input, key) => {
    if (key.escape) {
      navigate("slack");
      return;
    }
    if (key.upArrow) {
      setRow((r) => Math.max(0, r - 1));
      return;
    }
    if (key.downArrow) {
      setRow((r) => Math.min(ROWS - 1, r + 1));
      return;
    }
    if (key.leftArrow) {
      setCol((c) => Math.max(0, c - 1));
      return;
    }
    if (key.rightArrow) {
      setCol((c) => Math.min(COLS - 1, c + 1));
      return;
    }
    if (key.return) {
      if (selectedChannel && selectedMessage) {
        mutations.addReaction.mutate(
          {
            channel: selectedChannel.id,
            ts: selectedMessage.ts,
            emoji: selectedEmoji,
          },
          {
            onSuccess: () => {
              showStatus(`Added :${selectedEmoji}:`);
              navigate("slack");
            },
            onError: (err: any) => {
              showStatus(`Error: ${err.message}`);
              navigate("slack");
            },
          },
        );
      } else {
        navigate("slack");
      }
      return;
    }
  });

  const theme = getTheme();
  const boxWidth = Math.min(50, width - 4);

  return (
    <Box
      flexDirection="column"
      width={boxWidth}
      borderStyle="round"
      borderColor={theme.ui.border}
      paddingX={1}
    >
      <Text bold color={theme.ui.heading}>
        Add Reaction
      </Text>
      <Box height={1} />
      {EMOJIS.map((rowEmojis, ri) => (
        <Box key={ri}>
          {rowEmojis.map((emoji, ci) => {
            const isSelected = ri === row && ci === col;
            const label = `:${emoji}:`.padEnd(18);
            return (
              <Text key={emoji} inverse={isSelected} bold={isSelected}>
                {label}
              </Text>
            );
          })}
        </Box>
      ))}
      <Box height={1} />
      <Text dimColor>
        {"\u2191\u2193\u2190\u2192"}: navigate | Enter: apply | Esc: cancel
      </Text>
    </Box>
  );
}
