export function relativeTime(dateStr: string): {
  text: string;
  isRecent: boolean;
} {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  const isRecent = diffMin < 60;

  if (diffMin < 1) return { text: "now", isRecent };
  if (diffMin < 60) return { text: `${diffMin}m`, isRecent };
  if (diffHour < 24) return { text: `${diffHour}h`, isRecent };
  return { text: `${diffDay}d`, isRecent };
}
