import React, { useState, useMemo, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { listSlackConversations } from "../../api/slack-client.ts";
import { fuzzyMatch, fuzzyScore } from "../../utils/fuzzy.ts";
import { getTheme } from "../../ui/theme.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useSlackContext } from "./slack-context.ts";
import type { SlackChannel } from "../../api/types.ts";
import { getToken } from "../../utils/tokens.ts";

export function SlackChannelSearch() {
  const { height, width, config } = useAppContext();
  const { navigate } = useRouter();
  const { addSlackChannel, removeSlackChannel } = useSlackContext();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [allChannels, setAllChannels] = useState<SlackChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all channels on mount
  const slackToken = getToken("slackToken");
  useEffect(() => {
    if (!slackToken) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await listSlackConversations(
          slackToken,
          "public_channel,private_channel",
        );
        if (!cancelled) {
          setAllChannels(resp.channels);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slackToken]);

  const subscribedIds = new Set(config.slackChannels);

  const filtered = useMemo(() => {
    if (!query) return allChannels;
    return allChannels
      .filter((c) => fuzzyMatch(c.name, query))
      .sort((a, b) => fuzzyScore(b.name, query) - fuzzyScore(a.name, query));
  }, [allChannels, query]);

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);
  const listHeight = boxHeight - 5;
  const innerWidth = boxWidth - 4;

  const visible = filtered.slice(scrollOffset, scrollOffset + listHeight);

  const toggleChannel = (index: number) => {
    const ch = filtered[index];
    if (!ch) return;
    if (subscribedIds.has(ch.id)) {
      removeSlackChannel(ch.id);
    } else {
      addSlackChannel(ch.id);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      navigate("slack");
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => {
        const next = Math.max(0, i - 1);
        if (next < scrollOffset) setScrollOffset(next);
        return next;
      });
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => {
        const next = Math.min(filtered.length - 1, i + 1);
        if (next >= scrollOffset + listHeight) {
          setScrollOffset(next - listHeight + 1);
        }
        return next;
      });
      return;
    }
    if (key.return) {
      toggleChannel(selectedIndex);
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelectedIndex(0);
      setScrollOffset(0);
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelectedIndex(0);
      setScrollOffset(0);
    }
  });

  return (
    <Box
      flexDirection="column"
      width={boxWidth}
      height={boxHeight}
      borderStyle="round"
      borderColor={getTheme().ui.border}
      paddingX={1}
    >
      <Box>
        <Text bold color={getTheme().ui.heading}>
          Add / Remove Channel
        </Text>
        <Text dimColor>
          {" "}
          ({filtered.length}/{allChannels.length})
        </Text>
      </Box>
      <Box>
        <Text>Search: </Text>
        <Text>{query}</Text>
        <Text dimColor>{"\u2588"}</Text>
      </Box>
      {loading ? (
        <Spinner label="Loading channels..." />
      ) : filtered.length === 0 ? (
        <Text dimColor>
          {query ? "No channels match" : "No channels found"}
        </Text>
      ) : (
        visible.map((ch, i) => {
          const actualIndex = scrollOffset + i;
          const isSubscribed = subscribedIds.has(ch.id);
          const isActive = actualIndex === selectedIndex;
          const prefix = isSubscribed ? "\u2713 " : "  ";
          const label = (
            prefix +
            (ch.is_private ? "\u{1F512} " : "# ") +
            ch.name
          ).padEnd(innerWidth);
          return (
            <Box key={ch.id}>
              <Text
                backgroundColor={isActive ? "blue" : undefined}
                color={isActive ? "white" : undefined}
              >
                {label}
              </Text>
            </Box>
          );
        })
      )}
      <Box marginTop={0}>
        <Text dimColor>
          Enter: {"add/remove"} | Esc: close | {"\u2191\u2193"}: navigate
        </Text>
      </Box>
    </Box>
  );
}
