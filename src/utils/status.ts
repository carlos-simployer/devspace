import type { PullRequest } from "../api/types.ts";
import type { CheckContext } from "../hooks/use-pr-detail.ts";
import { colors, icons } from "../ui/theme.ts";

export interface StatusInfo {
  icon: string;
  color: string;
}

export function getCheckIcon(check: CheckContext): StatusInfo {
  if (check.conclusion) {
    switch (check.conclusion) {
      case "SUCCESS":
        return { icon: icons.success, color: colors.success };
      case "FAILURE":
        return { icon: icons.failure, color: colors.failure };
      case "NEUTRAL":
      case "SKIPPED":
        return { icon: icons.none, color: colors.muted };
      default:
        return { icon: icons.pending, color: colors.pending };
    }
  }
  if (check.state) {
    switch (check.state) {
      case "SUCCESS":
        return { icon: icons.success, color: colors.success };
      case "FAILURE":
      case "ERROR":
        return { icon: icons.failure, color: colors.failure };
      case "PENDING":
      case "EXPECTED":
        return { icon: icons.pending, color: colors.pending };
      default:
        return { icon: icons.none, color: colors.muted };
    }
  }
  return { icon: icons.pending, color: colors.pending };
}

export function getChangeTypeIcon(changeType: string): StatusInfo {
  switch (changeType) {
    case "ADDED":
      return { icon: "A", color: colors.success };
    case "DELETED":
      return { icon: "D", color: colors.failure };
    case "RENAMED":
      return { icon: "R", color: colors.pending };
    case "COPIED":
      return { icon: "C", color: colors.info };
    default:
      return { icon: "M", color: colors.pending };
  }
}

export function getReviewStatus(pr: PullRequest): StatusInfo {
  switch (pr.reviewDecision) {
    case "APPROVED":
      return { icon: icons.success, color: colors.success };
    case "CHANGES_REQUESTED":
      return { icon: icons.failure, color: colors.failure };
    case "REVIEW_REQUIRED":
      return { icon: icons.review, color: colors.pending };
    default:
      if (pr.reviewRequests.totalCount > 0) {
        return { icon: icons.review, color: colors.pending };
      }
      return { icon: icons.none, color: colors.muted };
  }
}

export function getCIStatus(pr: PullRequest): StatusInfo {
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup;
  if (!rollup) return { icon: icons.none, color: colors.muted };

  switch (rollup.state) {
    case "SUCCESS":
      return { icon: icons.success, color: colors.success };
    case "FAILURE":
    case "ERROR":
      return { icon: icons.failure, color: colors.failure };
    case "PENDING":
    case "EXPECTED":
      return { icon: icons.pending, color: colors.pending };
    default:
      return { icon: icons.none, color: colors.muted };
  }
}

export function getMergeableStatus(pr: PullRequest): StatusInfo {
  switch (pr.mergeable) {
    case "CONFLICTING":
      return { icon: icons.conflict, color: colors.failure };
    case "UNKNOWN":
      return { icon: "?", color: colors.muted };
    case "MERGEABLE":
      return { icon: icons.success, color: colors.success };
    default:
      return { icon: " ", color: colors.muted };
  }
}
