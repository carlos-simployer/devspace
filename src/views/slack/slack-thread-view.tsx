import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useSlackThread } from "../../hooks/use-slack-thread.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { slackMessageLink } from "../../utils/slack-links.ts";
import {
  formatSlackText,
  formatSlackTimestamp,
  getUserDisplayName,
} from "../../utils/slack-format.ts";
import { getTheme } from "../../ui/theme.ts";
import { useSlackContext } from "./slack-context.ts";
import { getToken } from "../../utils/tokens.ts";

export function SlackThreadView() {
  const { onQuit, width } = useAppContext();
  const { navigate } = useRouter();
  const ctx = useSlackContext();
  const {
    selectedChannel,
    selectedMessage,
    currentUserId,
    teamId,
    userCache,
    ensureUsers,
    mutations,
    showStatus,
    contentHeight,
  } = ctx;

  const threadTs = selectedMessage?.thread_ts ?? selectedMessage?.ts ?? null;
  const { replies, loading, fetching } = useSlackThread(
    getToken("slackToken"),
    selectedChannel?.id ?? null,
    threadTs,
  );

  const [replyIndex, setReplyIndex] = useState(0);
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Resolve user IDs
  useEffect(() => {
    if (replies.length > 0) {
      const ids = [...new Set(replies.map((m) => m.user).filter(Boolean))];
      ensureUsers(ids);
    }
  }, [replies, ensureUsers]);

  // Reset index when replies change
  useEffect(() => {
    if (replies.length > 0) {
      setReplyIndex(replies.length - 1);
    }
  }, [replies.length]);

  const theme = getTheme();

  // Reply input
  useInput(
    (input, key) => {
      if (key.escape) {
        setReplyMode(false);
        setReplyText("");
        return;
      }
      if (key.backspace || key.delete) {
        setReplyText((s) => s.slice(0, -1));
        return;
      }
      if (key.return) {
        if (replyText.trim() && selectedChannel && threadTs) {
          mutations.sendMessage.mutate(
            {
              channel: selectedChannel.id,
              text: replyText,
              threadTs,
            },
            {
              onSuccess: () => showStatus("Reply sent"),
              onError: (err: any) => showStatus(`Error: ${err.message}`),
            },
          );
        }
        setReplyMode(false);
        setReplyText("");
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setReplyText((s) => s + input);
      }
    },
    { isActive: replyMode },
  );

  useRouteShortcuts(
    {
      quit: onQuit,
      close: () => navigate("slack"),
      reply: () => {
        setReplyMode(true);
        setReplyText("");
      },
      react: () => navigate("slack/emoji"),
      open: () => {
        if (selectedChannel && teamId && replies[replyIndex]) {
          openInBrowser(
            slackMessageLink(
              teamId,
              selectedChannel.id,
              replies[replyIndex]!.ts,
            ),
          );
        }
      },
      up: () => setReplyIndex((i) => Math.max(0, i - 1)),
      down: () => setReplyIndex((i) => Math.min(replies.length - 1, i + 1)),
    },
    { active: !replyMode },
  );

  // Viewport windowing for replies
  const listHeight = contentHeight - 4; // header + status lines
  const startIdx = Math.max(0, replyIndex - Math.floor(listHeight / 2));
  const visibleReplies = replies.slice(startIdx, startIdx + listHeight);

  return (
    <Box flexDirection="column" height={contentHeight} width={width}>
      {/* Thread header */}
      <Box
        borderStyle="single"
        borderBottom
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
      >
        <Text bold>Thread</Text>
        {selectedMessage && (
          <Text dimColor>
            {" "}
            — {getUserDisplayName(selectedMessage.user, userCache)}:{" "}
            {formatSlackText(selectedMessage.text, userCache).slice(0, 60)}
          </Text>
        )}
      </Box>

      {/* Replies */}
      <Box flexDirection="column" flexGrow={1}>
        {loading ? (
          <Box paddingLeft={2} paddingTop={1}>
            <Spinner label="Loading thread..." />
          </Box>
        ) : replies.length === 0 ? (
          <Box paddingLeft={2} paddingTop={1}>
            <Text dimColor>No replies</Text>
          </Box>
        ) : (
          visibleReplies.map((msg) => {
            const actualIdx = replies.indexOf(msg);
            const isSelected = actualIdx === replyIndex;
            const authorName = getUserDisplayName(msg.user, userCache);
            const text = formatSlackText(msg.text, userCache).replace(
              /\n/g,
              " ",
            );
            const time = formatSlackTimestamp(msg.ts);
            const isOwnMsg = msg.user === currentUserId;

            return (
              <Box key={msg.ts}>
                <Text inverse={isSelected}>
                  {isSelected ? "> " : "  "}
                  <Text bold color={isOwnMsg ? theme.meta.branch : undefined}>
                    {authorName.slice(0, 16).padEnd(16)}
                  </Text>
                  <Text> {text.slice(0, width - 30)}</Text>
                  <Text dimColor> {time}</Text>
                </Text>
              </Box>
            );
          })
        )}
      </Box>

      {/* Status bar */}
      <Box
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
      >
        <Text>
          <Text bold> Thread </Text>
          <Text dimColor>|</Text>
          <Text> {replies.length} replies </Text>
          {fetching && (
            <>
              <Text dimColor>|</Text>
              <Text dimColor> Refreshing... </Text>
            </>
          )}
          {replyMode && (
            <>
              <Text dimColor>|</Text>
              <Text color={theme.input.comment}>
                {" "}
                Reply: {replyText}
                {"\u258C"}{" "}
              </Text>
            </>
          )}
          <Text dimColor>| esc: back | n: reply | e: react | o: open</Text>
        </Text>
      </Box>
    </Box>
  );
}
