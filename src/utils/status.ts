import type { PullRequest } from "../api/types.ts";

export interface StatusInfo {
  icon: string;
  color: string;
}

export function getReviewStatus(pr: PullRequest): StatusInfo {
  switch (pr.reviewDecision) {
    case "APPROVED":
      return { icon: "✓", color: "green" };
    case "CHANGES_REQUESTED":
      return { icon: "✗", color: "red" };
    case "REVIEW_REQUIRED":
      return { icon: "◌", color: "yellow" };
    default:
      if (pr.reviewRequests.totalCount > 0) {
        return { icon: "◌", color: "yellow" };
      }
      return { icon: "—", color: "gray" };
  }
}

export function getCIStatus(pr: PullRequest): StatusInfo {
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup;
  if (!rollup) return { icon: "—", color: "gray" };

  switch (rollup.state) {
    case "SUCCESS":
      return { icon: "✓", color: "green" };
    case "FAILURE":
    case "ERROR":
      return { icon: "✗", color: "red" };
    case "PENDING":
    case "EXPECTED":
      return { icon: "●", color: "yellow" };
    default:
      return { icon: "—", color: "gray" };
  }
}

export function getMergeableStatus(pr: PullRequest): StatusInfo {
  switch (pr.mergeable) {
    case "CONFLICTING":
      return { icon: "!", color: "red" };
    case "UNKNOWN":
      return { icon: "?", color: "gray" };
    case "MERGEABLE":
    default:
      return { icon: " ", color: "gray" };
  }
}
