import React, { useState, useEffect } from "react";
import { listSlackConversations } from "../../api/slack-client.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useSlackContext } from "./slack-context.ts";
import { SearchList } from "../../ui/search-list.tsx";
import type { SearchListItem } from "../../ui/search-list.tsx";
import type { SlackChannel } from "../../api/types.ts";
import { getToken } from "../../utils/tokens.ts";

export function SlackChannelSearch() {
  const { height, width, config } = useAppContext();
  const { navigate } = useRouter();
  const { addSlackChannel, removeSlackChannel } = useSlackContext();

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

  const items: SearchListItem[] = allChannels.map((ch) => ({
    key: ch.id,
    label: (ch.is_private ? "\u{1F512} " : "# ") + ch.name,
    isSelected: subscribedIds.has(ch.id),
  }));

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);

  return (
    <SearchList
      title="Add / Remove Channel"
      items={items}
      loading={loading}
      loadingLabel="Loading channels..."
      emptyLabel="No channels found"
      width={boxWidth}
      height={boxHeight}
      onSelect={(_index, item) => {
        const ch = allChannels.find((c) => c.id === item.key);
        if (!ch) return;
        if (subscribedIds.has(ch.id)) {
          removeSlackChannel(ch.id);
        } else {
          addSlackChannel(ch.id);
        }
      }}
      onClose={() => navigate("slack")}
    />
  );
}
