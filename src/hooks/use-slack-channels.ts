import { useQuery } from "@tanstack/react-query";
import { getSlackConversationInfo } from "../api/slack-client.ts";
import type { SlackChannel } from "../api/types.ts";

export function useSlackChannels(token: string, channelIds: string[]) {
  const { data, isLoading, isFetching, error, refetch } = useQuery<
    SlackChannel[]
  >({
    queryKey: ["slack-channels", channelIds],
    queryFn: async () => {
      if (channelIds.length === 0) return [];
      const results = await Promise.allSettled(
        channelIds.map((id) => getSlackConversationInfo(token, id)),
      );
      return results
        .filter(
          (r): r is PromiseFulfilledResult<SlackChannel> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
    },
    enabled: !!token && channelIds.length > 0,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  return {
    channels: data ?? [],
    loading: isLoading,
    fetching: isFetching,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
