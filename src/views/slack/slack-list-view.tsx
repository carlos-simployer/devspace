import React, { useState, useRef, useEffect } from "react";
import { Box, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useFocusNode } from "../../ui/focus.ts";
import { Sidebar } from "../../ui/sidebar.tsx";
import type { SidebarItem } from "../../ui/sidebar.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useTextInput } from "../../hooks/use-text-input.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { slackChannelLink, slackMessageLink } from "../../utils/slack-links.ts";
import { getUserDisplayName } from "../../utils/slack-format.ts";
import { useSlackContext } from "./slack-context.ts";
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

  // ── Focus nodes ─────────────────────────────────────────────────────
  const { isFocused: sidebarFocused } = useFocusNode({
    id: "sidebar",
    order: 0,
  });
  const { isFocused: listFocused } = useFocusNode({
    id: "list",
    order: 1,
  });

  // Layout measurement
  const statusRef = useRef<DOMElement>(null);
  const [measuredStatus, setMeasuredStatus] = useState(3);

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
  const gap = 1;
  const sidebarWidth = Math.min(
    Math.max(24, ...channels.map((c) => (c.name?.length ?? 0) + 8)),
    Math.floor(width * 0.35),
  );
  const listWidth = width - sidebarWidth - gap;

  // Sidebar items count (channels + add button)
  const sidebarItemCount = channels.length + 1;

  // ── Text input hook for compose/reply ─────────────────────────────
  const messageInput = useTextInput();

  // ── Input mode: raw text capture ──────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) {
        setInputMode("none");
        setInputText("");
        messageInput.clear();
        showStatus("Cancelled");
        return;
      }
      if (key.return) {
        if (messageInput.query.trim() && selectedChannel) {
          const threadTs =
            inputMode === "reply"
              ? (selectedMessage?.thread_ts ?? selectedMessage?.ts)
              : undefined;
          mutations.sendMessage.mutate(
            {
              channel: selectedChannel.id,
              text: messageInput.query,
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
        messageInput.clear();
        return;
      }
      if (messageInput.handleInput(input, key)) {
        setInputText(messageInput.query + (input || ""));
      }
    },
    { isActive: inputMode !== "none" && route === "slack" },
  );

  // Sync messageInput.query -> inputText
  useEffect(() => {
    if (inputMode !== "none") {
      setInputText(messageInput.query);
    }
  }, [messageInput.query, inputMode, setInputText]);

  // ── Route shortcuts with focusHandlers ─────────────────────────────
  const isMainView = route === "slack";

  useRouteShortcuts(
    {
      quit: onQuit,

      // Compose
      compose: () => {
        if (selectedChannel) {
          setInputMode("compose");
          setInputText("");
          messageInput.clear();
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
          messageInput.clear();
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
    },
    {
      active: inputMode === "none" && isMainView,
      focusHandlers: {
        sidebar: {
          up: () => setSidebarIndex((i) => Math.max(0, i - 1)),
          down: () =>
            setSidebarIndex((i) => Math.min(sidebarItemCount - 1, i + 1)),
          select: () => {
            if (sidebarIndex === channels.length) {
              navigate("slack/search");
            }
          },
          open: () => {
            if (sidebarIndex === channels.length) {
              navigate("slack/search");
            }
          },
          remove: () => {
            if (selectedChannel) {
              removeSlackChannel(selectedChannel.id);
              setSidebarIndex((i) => Math.max(0, i - 1));
              showStatus("Channel removed");
            }
          },
        },
        list: {
          up: () => setMessageIndex((i) => Math.max(0, i - 1)),
          down: () =>
            setMessageIndex((i) => Math.min(messages.length - 1, i + 1)),
          select: () => {
            if (selectedMessage) {
              if ((selectedMessage.reply_count ?? 0) > 0) {
                navigate("slack/thread");
              } else {
                setInputMode("reply");
                setInputText("");
                messageInput.clear();
              }
            }
          },
        },
      },
    },
  );

  const mainHeight = ctx.contentHeight - measuredStatus;

  // Build sidebar items for the Sidebar component
  const sidebarItems: SidebarItem[] = [
    ...channels.map((ch) => {
      const isDm = ch.is_im;
      let label: string;
      let prefix: string;
      let prefixColor: string | undefined;
      if (isDm && ch.user) {
        const name = getUserDisplayName(ch.user, userCache);
        const presence = presenceMap.get(ch.user);
        prefix = presence === "active" ? "\u25CF " : "\u25CB ";
        prefixColor = presence === "active" ? "green" : undefined;
        label = name;
      } else {
        prefix = ch.is_private ? "\u{1F512} " : "# ";
        label = ch.name;
        const unread =
          ch.unread_count && ch.unread_count > 0 ? ` (${ch.unread_count})` : "";
        label = `${ch.name}${unread}`;
        prefixColor = undefined;
      }
      const hasUnread = (ch.unread_count ?? 0) > 0;
      return {
        key: ch.id,
        label,
        prefix,
        prefixColor,
        isCurrent: ch.id === selectedChannel?.id,
        bold: hasUnread,
      };
    }),
    {
      key: "add",
      label: "[+] Add channel",
      isAdd: true,
    },
  ];

  return (
    <Box flexGrow={1} width={width} flexDirection="column">
      <Box flexGrow={1} height={mainHeight} gap={gap}>
        <Sidebar
          title="Channels"
          items={sidebarItems}
          selectedIndex={sidebarIndex}
          focused={sidebarFocused}
          width={sidebarWidth}
          height={mainHeight}
        />
        <MessageList
          messages={messages}
          selectedIndex={messageIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={listFocused}
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
