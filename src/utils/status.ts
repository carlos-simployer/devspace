import type { PullRequest } from "../api/types.ts";
import type { CheckContext } from "../hooks/use-pr-detail.ts";
import { getTheme, icons } from "../ui/theme.ts";

export interface StatusInfo {
  icon: string;
  color: string;
}

export function getCheckIcon(check: CheckContext): StatusInfo {
  const t = getTheme();
  if (check.conclusion) {
    switch (check.conclusion) {
      case "SUCCESS":
        return { icon: icons.success, color: t.status.success };
      case "FAILURE":
        return { icon: icons.failure, color: t.status.failure };
      case "NEUTRAL":
      case "SKIPPED":
        return { icon: icons.none, color: t.status.muted };
      default:
        return { icon: icons.pending, color: t.status.pending };
    }
  }
  if (check.state) {
    switch (check.state) {
      case "SUCCESS":
        return { icon: icons.success, color: t.status.success };
      case "FAILURE":
      case "ERROR":
        return { icon: icons.failure, color: t.status.failure };
      case "PENDING":
      case "EXPECTED":
        return { icon: icons.pending, color: t.status.pending };
      default:
        return { icon: icons.none, color: t.status.muted };
    }
  }
  return { icon: icons.pending, color: t.status.pending };
}

export function getChangeTypeIcon(changeType: string): StatusInfo {
  const t = getTheme();
  switch (changeType) {
    case "ADDED":
      return { icon: "A", color: t.status.success };
    case "DELETED":
      return { icon: "D", color: t.status.failure };
    case "RENAMED":
      return { icon: "R", color: t.status.pending };
    case "COPIED":
      return { icon: "C", color: t.status.info };
    default:
      return { icon: "M", color: t.status.pending };
  }
}

export function getReviewStatus(pr: PullRequest): StatusInfo {
  const t = getTheme();
  switch (pr.reviewDecision) {
    case "APPROVED":
      return { icon: icons.success, color: t.status.success };
    case "CHANGES_REQUESTED":
      return { icon: icons.failure, color: t.status.failure };
    case "REVIEW_REQUIRED":
      return { icon: icons.review, color: t.status.pending };
    default:
      if (pr.reviewRequests.totalCount > 0) {
        return { icon: icons.review, color: t.status.pending };
      }
      return { icon: icons.none, color: t.status.muted };
  }
}

export function getCIStatus(pr: PullRequest): StatusInfo {
  const t = getTheme();
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup;
  if (!rollup) return { icon: icons.none, color: t.status.muted };

  switch (rollup.state) {
    case "SUCCESS":
      return { icon: icons.success, color: t.status.success };
    case "FAILURE":
    case "ERROR":
      return { icon: icons.failure, color: t.status.failure };
    case "PENDING":
    case "EXPECTED":
      return { icon: icons.pending, color: t.status.pending };
    default:
      return { icon: icons.none, color: t.status.muted };
  }
}

export function getMergeableStatus(pr: PullRequest): StatusInfo {
  const t = getTheme();
  switch (pr.mergeable) {
    case "CONFLICTING":
      return { icon: icons.conflict, color: t.status.failure };
    case "UNKNOWN":
      return { icon: "?", color: t.status.muted };
    case "MERGEABLE":
      return { icon: icons.success, color: t.status.success };
    default:
      return { icon: " ", color: t.status.muted };
  }
}
