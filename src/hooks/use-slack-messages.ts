import { useQuery } from "@tanstack/react-query";
import { getSlackHistory } from "../api/slack-client.ts";
import type { SlackMessage } from "../api/types.ts";

export function useSlackMessages(
  token: string,
  channelId: string | null,
  enabled: boolean = true,
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery<{
    messages: SlackMessage[];
    hasMore: boolean;
  }>({
    queryKey: ["slack-messages", channelId],
    queryFn: async () => {
      if (!channelId) return { messages: [], hasMore: false };
      const resp = await getSlackHistory(token, channelId, 50);
      // Slack returns newest first; reverse for chronological order
      return {
        messages: resp.messages.reverse(),
        hasMore: resp.has_more,
      };
    },
    enabled: !!token && !!channelId && enabled,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  return {
    messages: data?.messages ?? [],
    hasMore: data?.hasMore ?? false,
    loading: isLoading,
    fetching: isFetching,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
