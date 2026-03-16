import { useQuery } from "@tanstack/react-query";
import { getSlackUserPresence } from "../api/slack-client.ts";
import type { SlackChannel } from "../api/types.ts";

/**
 * Polls presence for DM users in subscribed channels.
 */
export function useSlackPresence(
  token: string,
  channels: SlackChannel[],
  enabled: boolean = true,
) {
  // Collect DM user IDs
  const dmUserIds = channels
    .filter((c) => c.is_im && c.user)
    .map((c) => c.user!)
    .filter(Boolean);

  const { data } = useQuery<Map<string, "active" | "away">>({
    queryKey: ["slack-presence", dmUserIds],
    queryFn: async () => {
      const map = new Map<string, "active" | "away">();
      const results = await Promise.allSettled(
        dmUserIds.map(async (id) => {
          const p = await getSlackUserPresence(token, id);
          return { id, presence: p.presence };
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled") {
          map.set(r.value.id, r.value.presence);
        }
      }
      return map;
    },
    enabled: !!token && dmUserIds.length > 0 && enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    presenceMap: data ?? new Map<string, "active" | "away">(),
  };
}
