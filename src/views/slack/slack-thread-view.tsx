import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useTextInput } from "../../hooks/use-text-input.ts";
import { useSlackThread } from "../../hooks/use-slack-thread.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { slackMessageLink } from "../../utils/slack-links.ts";
import {
  formatSlackText,
  formatSlackTimestamp,
  getUserDisplayName,
} from "../../utils/slack-format.ts";
import { getTheme } from "../../ui/theme.ts";
import { Panel } from "../../ui/panel.tsx";
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
  const replyInput = useTextInput();

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
        replyInput.clear();
        return;
      }
      if (key.return) {
        if (replyInput.query.trim() && selectedChannel && threadTs) {
          mutations.sendMessage.mutate(
            {
              channel: selectedChannel.id,
              text: replyInput.query,
              threadTs,
            },
            {
              onSuccess: () => showStatus("Reply sent"),
              onError: (err: any) => showStatus(`Error: ${err.message}`),
            },
          );
        }
        setReplyMode(false);
        replyInput.clear();
        return;
      }
      replyInput.handleInput(input, key);
    },
    { isActive: replyMode },
  );

  useRouteShortcuts(
    {
      quit: onQuit,
      close: () => navigate("slack"),
      reply: () => {
        setReplyMode(true);
        replyInput.clear();
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

  // Panel borders (2) + status bar (2) = 4
  const panelHeight = contentHeight - 2;
  const listHeight = panelHeight - 2; // panel borders
  const startIdx = Math.max(0, replyIndex - Math.floor(listHeight / 2));
  const visibleReplies = replies.slice(startIdx, startIdx + listHeight);

  const threadTitle = selectedMessage
    ? `Thread \u2014 ${getUserDisplayName(selectedMessage.user, userCache)}: ${formatSlackText(selectedMessage.text, userCache).slice(0, 40)}`
    : "Thread";

  return (
    <Box flexDirection="column" height={contentHeight} width={width}>
      <Panel
        title={threadTitle}
        focused={true}
        width={width}
        height={panelHeight}
      >
        {loading ? (
          <Box paddingLeft={1} paddingTop={1}>
            <Spinner label="Loading thread..." />
          </Box>
        ) : replies.length === 0 ? (
          <Box paddingLeft={1} paddingTop={1}>
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
      </Panel>

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
                Reply: {replyInput.query}
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
