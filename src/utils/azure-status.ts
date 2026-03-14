import { getTheme } from "../ui/theme.ts";

interface StatusInfo {
  icon: string;
  color: string;
}

export function getBuildStatusIcon(
  status: string,
  result: string | null,
): StatusInfo {
  const t = getTheme();

  if (status === "completed") {
    switch (result) {
      case "succeeded":
        return { icon: "✓", color: t.status.success };
      case "partiallySucceeded":
        return { icon: "◐", color: t.status.pending };
      case "failed":
        return { icon: "✗", color: t.status.failure };
      case "canceled":
        return { icon: "⊘", color: t.status.muted };
      default:
        return { icon: "●", color: t.status.muted };
    }
  }

  if (status === "inProgress" || status === "cancelling") {
    return { icon: "◌", color: t.status.pending };
  }

  if (status === "notStarted" || status === "postponed") {
    return { icon: "○", color: t.status.muted };
  }

  return { icon: "●", color: t.status.muted };
}

export function getReleaseEnvStatusIcon(status: string): StatusInfo {
  const t = getTheme();

  switch (status) {
    case "succeeded":
      return { icon: "●", color: t.status.success };
    case "inProgress":
    case "queued":
      return { icon: "●", color: t.status.pending };
    case "rejected":
      return { icon: "●", color: t.status.failure };
    case "canceled":
      return { icon: "●", color: t.status.muted };
    case "partiallySucceeded":
      return { icon: "◐", color: t.status.pending };
    case "notStarted":
    default:
      return { icon: "○", color: t.status.muted };
  }
}

export function formatBranch(sourceBranch: string): string {
  if (sourceBranch.startsWith("refs/heads/")) {
    return sourceBranch.slice("refs/heads/".length);
  }
  if (sourceBranch.startsWith("refs/pull/")) {
    const parts = sourceBranch.slice("refs/pull/".length).split("/");
    return `PR #${parts[0]}`;
  }
  return sourceBranch;
}

export function formatDuration(
  startTime: string | null,
  finishTime: string | null,
): string {
  if (!startTime || !finishTime) return "";
  const ms = new Date(finishTime).getTime() - new Date(startTime).getTime();
  if (ms < 0) return "";

  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

export function getBuildReasonLabel(reason: string): string {
  switch (reason) {
    case "manual":
      return "Manual";
    case "individualCI":
    case "batchedCI":
      return "CI";
    case "pullRequest":
      return "PR";
    case "schedule":
      return "Scheduled";
    case "buildCompletion":
    case "triggered":
      return "Triggered";
    default:
      return reason;
  }
}
