import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Box, Text } from "ink";
import { useStore } from "zustand";
import { useAppContext } from "../../app-context.ts";
import { useRouter, Outlet, useOutlet } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useSlackAuth } from "../../hooks/use-slack-auth.ts";
import { useSlackUsers } from "../../hooks/use-slack-users.ts";
import { useSlackChannels } from "../../hooks/use-slack-channels.ts";
import { useSlackMessages } from "../../hooks/use-slack-messages.ts";
import { useSlackPresence } from "../../hooks/use-slack-presence.ts";
import { useSlackMutations } from "../../hooks/use-slack-mutations.ts";
import {
  SlackContext,
  type SlackContextValue,
  type SlackInputMode,
} from "./slack-context.ts";
import { getToken } from "../../utils/tokens.ts";
import { slackStore } from "./slack-store.ts";

export function SlackLayout() {
  const {
    config,
    addSlackChannel,
    removeSlackChannel,
    width,
    contentHeight,
    onQuit,
  } = useAppContext();
  const { route } = useRouter();
  const outlet = useOutlet();
  const token = getToken("slackToken");

  // Must be called unconditionally (React rules of hooks) — enables
  // tab switching, number keys, quit, and help even on "not configured" screen.
  useRouteShortcuts({ quit: onQuit });

  // Auth
  const {
    userId: currentUserId,
    teamId,
    error: authError,
  } = useSlackAuth(token);

  // Persisted state (survives tab switches)
  const {
    focus,
    setFocus,
    sidebarIndex,
    setSidebarIndex,
    messageIndex,
    setMessageIndex,
  } = useStore(slackStore);
  // Transient state (resets on tab switch)
  const [inputMode, setInputMode] = useState<SlackInputMode>("none");
  const [inputText, setInputText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data hooks
  const {
    channels,
    loading: channelsLoading,
    fetching: channelsFetching,
    error: channelsError,
    refetch: refetchChannels,
  } = useSlackChannels(token, config.slackChannels);
  const selectedChannel = channels[sidebarIndex] ?? null;

  const {
    messages,
    loading: msgsLoading,
    fetching: msgsFetching,
    error: msgsError,
    refetch: refetchMessages,
  } = useSlackMessages(token, selectedChannel?.id ?? null, route === "slack");

  const { userCache, ensureUsers } = useSlackUsers(token);
  const { presenceMap } = useSlackPresence(token, channels);
  const mutations = useSlackMutations(token);

  // Resolve user IDs from messages
  useEffect(() => {
    if (messages.length > 0) {
      const ids = [...new Set(messages.map((m) => m.user).filter(Boolean))];
      ensureUsers(ids);
    }
  }, [messages, ensureUsers]);

  // Reset messageIndex when messages change or channel changes
  useEffect(() => {
    if (messages.length > 0) {
      setMessageIndex(messages.length - 1);
    } else {
      setMessageIndex(-1);
    }
  }, [selectedChannel?.id, messages.length]);

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatusMessage(""), 3000);
  }, []);

  const refetch = useCallback(() => {
    refetchChannels();
    refetchMessages();
  }, [refetchChannels, refetchMessages]);

  const selectedMessage = messages[messageIndex] ?? null;

  const ctx: SlackContextValue = useMemo(
    () => ({
      contentHeight,
      focus,
      setFocus,
      sidebarIndex,
      setSidebarIndex,
      messageIndex,
      setMessageIndex,
      selectedChannel,
      channels,
      messages,
      selectedMessage,
      loading: channelsLoading || msgsLoading,
      fetching: channelsFetching || msgsFetching,
      error: authError || channelsError || msgsError,
      inputMode,
      setInputMode,
      inputText,
      setInputText,
      statusMessage,
      showStatus,
      currentUserId,
      teamId,
      userCache,
      ensureUsers,
      presenceMap,
      addSlackChannel,
      removeSlackChannel,
      mutations,
      refetch,
    }),
    [
      contentHeight,
      focus,
      sidebarIndex,
      messageIndex,
      selectedChannel,
      channels,
      messages,
      selectedMessage,
      channelsLoading,
      msgsLoading,
      channelsFetching,
      msgsFetching,
      authError,
      channelsError,
      msgsError,
      inputMode,
      inputText,
      statusMessage,
      showStatus,
      currentUserId,
      teamId,
      userCache,
      ensureUsers,
      presenceMap,
      addSlackChannel,
      removeSlackChannel,
      mutations,
      refetch,
    ],
  );

  // Not configured
  if (!token) {
    return (
      <SlackContext.Provider value={ctx}>
        <Box
          height={contentHeight}
          width={width}
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Text bold>Slack not configured</Text>
          <Text dimColor>
            Set your Slack token in the Config tab (press 8) under "Slack"
          </Text>
        </Box>
      </SlackContext.Provider>
    );
  }

  // Overlay child
  if (outlet?.isOverlay) {
    return (
      <SlackContext.Provider value={ctx}>
        <Box
          height={contentHeight}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </SlackContext.Provider>
    );
  }

  return (
    <SlackContext.Provider value={ctx}>
      <Box height={contentHeight} width={width} flexDirection="column">
        <Outlet />
      </Box>
    </SlackContext.Provider>
  );
}
