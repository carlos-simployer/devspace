import { useRef, useCallback, useState } from "react";
import { getSlackUserInfo } from "../api/slack-client.ts";
import type { SlackUser } from "../api/types.ts";

/**
 * Lazily fetches and caches Slack user info.
 * Call `ensureUsers(ids)` to trigger fetches for unknown IDs.
 */
export function useSlackUsers(token: string) {
  const cacheRef = useRef<Map<string, SlackUser>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const [, setTick] = useState(0);

  const ensureUsers = useCallback(
    (userIds: string[]) => {
      if (!token) return;
      const toFetch = userIds.filter(
        (id) => id && !cacheRef.current.has(id) && !pendingRef.current.has(id),
      );
      if (toFetch.length === 0) return;

      for (const id of toFetch) {
        pendingRef.current.add(id);
        getSlackUserInfo(token, id)
          .then((user) => {
            cacheRef.current.set(id, user);
            pendingRef.current.delete(id);
            setTick((t) => t + 1);
          })
          .catch(() => {
            pendingRef.current.delete(id);
          });
      }
    },
    [token],
  );

  return {
    userCache: cacheRef.current,
    ensureUsers,
  };
}
