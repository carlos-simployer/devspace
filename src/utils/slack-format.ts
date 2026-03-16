import type { SlackUser } from "../api/types.ts";

/**
 * Convert Slack mrkdwn and special tokens to plain terminal text.
 * Accepts a user cache for resolving <@U123> mentions.
 */
export function formatSlackText(
  text: string,
  userCache: Map<string, SlackUser>,
): string {
  if (!text) return "";

  let result = text;

  // User mentions: <@U123> or <@U123|name>
  result = result.replace(/<@([A-Z0-9]+)(?:\|([^>]+))?>/g, (_m, id, name) => {
    if (name) return `@${name}`;
    const user = userCache.get(id);
    return user ? `@${user.display_name || user.name}` : `@${id}`;
  });

  // Channel mentions: <#C123|channel-name>
  result = result.replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1");
  // Channel mentions without name: <#C123>
  result = result.replace(/<#([A-Z0-9]+)>/g, "#$1");

  // Special mentions
  result = result.replace(/<!here>/g, "@here");
  result = result.replace(/<!channel>/g, "@channel");
  result = result.replace(/<!everyone>/g, "@everyone");

  // URLs: <https://example.com|label> or <https://example.com>
  result = result.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, "$2");
  result = result.replace(/<(https?:\/\/[^>]+)>/g, "$1");

  // Strip remaining unknown markup angle brackets
  result = result.replace(/<([^>]+)>/g, "$1");

  // HTML entities
  result = result.replace(/&amp;/g, "&");
  result = result.replace(/&lt;/g, "<");
  result = result.replace(/&gt;/g, ">");

  return result;
}

/**
 * Format a Slack timestamp to a human-readable time.
 * Shows "2:45 PM" for today, "Mar 14" for older.
 */
export function formatSlackTimestamp(ts: string): string {
  const date = new Date(parseFloat(ts) * 1000);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get the display name for a user ID from the cache.
 */
export function getUserDisplayName(
  userId: string,
  userCache: Map<string, SlackUser>,
): string {
  const user = userCache.get(userId);
  if (!user) return userId;
  return user.display_name || user.real_name || user.name;
}
