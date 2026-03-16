import { useQuery } from "@tanstack/react-query";
import { testSlackAuth } from "../api/slack-client.ts";
import type { SlackAuthInfo } from "../api/types.ts";

export function useSlackAuth(token: string) {
  const { data, isLoading, error } = useQuery<SlackAuthInfo>({
    queryKey: ["slack-auth"],
    queryFn: () => testSlackAuth(token),
    staleTime: Infinity,
    enabled: !!token,
    retry: 1,
  });

  return {
    auth: data ?? null,
    userId: data?.user_id ?? "",
    teamId: data?.team_id ?? "",
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}
