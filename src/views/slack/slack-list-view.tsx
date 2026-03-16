import React, { useState, useRef, useEffect } from "react";
import { Box, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { slackChannelLink, slackMessageLink } from "../../utils/slack-links.ts";
import { useSlackContext } from "./slack-context.ts";
import { ChannelSidebar } from "./channel-sidebar.tsx";
import { MessageList } from "./message-list.tsx";
import { SlackStatusBar } from "./slack-status-bar.tsx";

export function SlackListView() {
  const { onQuit, width } = useAppContext();
  const { route, navigate } = useRouter();
  const ctx = useSlackContext();

  const {
    selectedChannel,
    channels,
    messages,
    selectedMessage,
    focus,
    setFocus,
    sidebarIndex,
    setSidebarIndex,
    messageIndex,
    setMessageIndex,
    inputMode,
    setInputMode,
    inputText,
    setInputText,
    loading,
    fetching,
    statusMessage,
    showStatus,
    currentUserId,
    teamId,
    userCache,
    presenceMap,
    removeSlackChannel,
    mutations,
    refetch,
  } = ctx;

  // Layout measurement
  const statusRef = useRef<DOMElement>(null);
  const [measuredStatus, setMeasuredStatus] = useState(2);

  useEffect(() => {
    if (statusRef.current) {
      const h = measureElement(statusRef.current).height;
      setMeasuredStatus((prev) => (prev === h ? prev : h));
    }
  });

  // Mark channel as read when switching
  useEffect(() => {
    if (selectedChannel && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        mutations.markRead.mutate({
          channel: selectedChannel.id,
          ts: lastMsg.ts,
        });
      }
    }
  }, [selectedChannel?.id]); // only trigger on channel switch

  // Sidebar width
  const sidebarWidth = Math.min(
    Math.max(24, ...channels.map((c) => (c.name?.length ?? 0) + 8)),
    Math.floor(width * 0.35),
  );
  const listWidth = width - sidebarWidth;

  // Sidebar items count (channels + add button)
  const sidebarItemCount = channels.length + 1;

  // ── Input mode: raw text capture ──────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) {
        setInputMode("none");
        setInputText("");
        showStatus("Cancelled");
        return;
      }
      if (key.backspace || key.delete) {
        setInputText((s) => s.slice(0, -1));
        return;
      }
      if (key.return) {
        if (inputText.trim() && selectedChannel) {
          const threadTs =
            inputMode === "reply"
              ? (selectedMessage?.thread_ts ?? selectedMessage?.ts)
              : undefined;
          mutations.sendMessage.mutate(
            {
              channel: selectedChannel.id,
              text: inputText,
              threadTs,
            },
            {
              onSuccess: () => {
                showStatus("Message sent");
                refetch();
              },
              onError: (err: any) => showStatus(`Error: ${err.message}`),
            },
          );
        }
        setInputMode("none");
        setInputText("");
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setInputText((s) => s + input);
      }
    },
    { isActive: inputMode !== "none" && route === "slack" },
  );

  // ── Route shortcuts ───────────────────────────────────────────────────
  useRouteShortcuts(
    {
      quit: onQuit,

      // Compose
      compose: () => {
        if (selectedChannel) {
          setInputMode("compose");
          setInputText("");
        }
      },

      // Thread
      thread: () => {
        if (selectedMessage && (selectedMessage.reply_count ?? 0) > 0) {
          navigate("slack/thread");
        } else if (selectedMessage) {
          // Reply to this message
          setInputMode("reply");
          setInputText("");
        }
      },

      // React
      react: () => {
        if (selectedMessage) {
          navigate("slack/emoji");
        }
      },

      // Delete
      delete: () => {
        if (
          selectedMessage &&
          selectedMessage.user === currentUserId &&
          selectedChannel
        ) {
          mutations.deleteMessage.mutate(
            { channel: selectedChannel.id, ts: selectedMessage.ts },
            {
              onSuccess: () => {
                showStatus("Message deleted");
                refetch();
              },
              onError: (err: any) => showStatus(`Error: ${err.message}`),
            },
          );
        }
      },

      // Open in Slack
      open: () => {
        if (selectedChannel && teamId) {
          const url = selectedMessage
            ? slackMessageLink(teamId, selectedChannel.id, selectedMessage.ts)
            : slackChannelLink(teamId, selectedChannel.id);
          openInBrowser(url);
        }
      },

      // Add channel
      add: () => navigate("slack/search"),

      // Remove channel
      remove: () => {
        if (focus === "sidebar" && selectedChannel) {
          removeSlackChannel(selectedChannel.id);
          setSidebarIndex((i) => Math.max(0, i - 1));
          showStatus("Channel removed");
        }
      },

      // Status
      status: () => navigate("slack/status"),

      // Presence toggle
      presence: () => {
        const newPresence =
          presenceMap.get(currentUserId) === "active" ? "away" : "auto";
        mutations.setPresence.mutate(
          { presence: newPresence as "auto" | "away" },
          {
            onSuccess: () =>
              showStatus(
                newPresence === "away" ? "Set to away" : "Set to active",
              ),
          },
        );
      },

      // Refresh
      refresh: () => refetch(),

      // Navigation
      left: () => setFocus("sidebar"),
      right: () => setFocus("list"),
      up: () => {
        if (focus === "sidebar") {
          setSidebarIndex((i) => Math.max(0, i - 1));
        } else {
          setMessageIndex((i) => Math.max(0, i - 1));
        }
      },
      down: () => {
        if (focus === "sidebar") {
          setSidebarIndex((i) => Math.min(sidebarItemCount - 1, i + 1));
        } else {
          setMessageIndex((i) => Math.min(messages.length - 1, i + 1));
        }
      },
      select: () => {
        if (focus === "sidebar") {
          if (sidebarIndex === channels.length) {
            // "[+] Add channel" selected
            navigate("slack/search");
          }
        } else if (selectedMessage) {
          if ((selectedMessage.reply_count ?? 0) > 0) {
            navigate("slack/thread");
          } else {
            setInputMode("reply");
            setInputText("");
          }
        }
      },
    },
    { active: inputMode === "none" && route === "slack" },
  );

  const mainHeight = ctx.contentHeight - measuredStatus;

  return (
    <Box flexGrow={1} width={width} flexDirection="column">
      <Box flexGrow={1} height={mainHeight}>
        <ChannelSidebar
          channels={channels}
          selectedIndex={sidebarIndex}
          isFocused={focus === "sidebar"}
          width={sidebarWidth}
          selectedChannel={selectedChannel}
          userCache={userCache}
          presenceMap={presenceMap}
        />
        <MessageList
          messages={messages}
          selectedIndex={messageIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={focus === "list"}
          loading={loading}
          currentUserId={currentUserId}
          userCache={userCache}
        />
      </Box>
      <Box ref={statusRef} flexDirection="column">
        <SlackStatusBar
          channel={selectedChannel}
          messageCount={messages.length}
          fetching={fetching}
          statusMessage={statusMessage}
          inputMode={inputMode}
          inputText={inputText}
          width={width}
        />
      </Box>
    </Box>
  );
}
