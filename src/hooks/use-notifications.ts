import { useState, useEffect, useRef, useCallback } from "react";

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

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(
        "https://api.github.com/notifications?participating=true&per_page=50",
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );
      if (!res.ok) return;

      const data: GitHubNotification[] = await res.json();
      const prNotifications = data.filter(
        (n) => n.subject.type === "PullRequest",
      );
      setNotifications(prNotifications);
      setUnreadCount(prNotifications.filter((n) => n.unread).length);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    timerRef.current = setInterval(
      fetchNotifications,
      NOTIFICATION_POLL_INTERVAL,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNotifications]);

  return { notifications, loading, unreadCount, refetch: fetchNotifications };
}
