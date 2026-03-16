import { useQuery } from "@tanstack/react-query";
import { getSlackReplies } from "../api/slack-client.ts";
import type { SlackMessage } from "../api/types.ts";

export function useSlackThread(
  token: string,
  channelId: string | null,
  threadTs: string | null,
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery<
    SlackMessage[]
  >({
    queryKey: ["slack-thread", channelId, threadTs],
    queryFn: async () => {
      if (!channelId || !threadTs) return [];
      const resp = await getSlackReplies(token, channelId, threadTs);
      return resp.messages;
    },
    enabled: !!token && !!channelId && !!threadTs,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  return {
    replies: data ?? [],
    loading: isLoading,
    fetching: isFetching,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
