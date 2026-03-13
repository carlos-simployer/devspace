import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const NOTIFICATION_POLL_INTERVAL = 60_000;

export interface GitHubNotification {
  id: string;
  repository: {
    full_name: string;
  };
  subject: {
    title: string;
    type: string;
    url: string | null;
  };
  reason: string;
  unread: boolean;
  updated_at: string;
}

async function fetchNotifications(
  token: string,
): Promise<GitHubNotification[]> {
  const res = await fetch(
    "https://api.github.com/notifications?participating=true&per_page=50",
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );
  if (!res.ok) return [];

  const data: GitHubNotification[] = await res.json();
  return data.filter((n) => n.subject.type === "PullRequest");
}

export function useNotifications(token: string | null) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(token!),
    enabled: !!token,
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
  });

  const notifications = data ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  return { notifications, loading: isLoading, unreadCount, refetch };
}
