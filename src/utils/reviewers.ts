import type { PullRequest } from "../api/types.ts";

export interface ReviewerInfo {
  name: string;
  state: "approved" | "changes" | "reviewed" | "pending";
}

export function getReviewers(pr: PullRequest): ReviewerInfo[] {
  const map = new Map<string, ReviewerInfo>();

  // Submitted reviews
  for (const review of pr.latestReviews.nodes) {
    if (review.author.login === pr.author.login) continue;
    const state =
      review.state === "APPROVED"
        ? "approved"
        : review.state === "CHANGES_REQUESTED"
          ? "changes"
          : "reviewed";
    map.set(review.author.login, { name: review.author.login, state });
  }

  // Requested reviewers (pending)
  for (const req of pr.reviewRequests.nodes) {
    const login = req.requestedReviewer?.login ?? req.requestedReviewer?.name;
    if (!login) continue;
    if (!map.has(login)) {
      map.set(login, { name: login, state: "pending" });
    }
  }

  return [...map.values()];
}

export function hexToAnsiColor(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (r > g && r > b) return "red";
  if (g > r && g > b) return "green";
  if (b > r && b > g) return "blue";
  if (r > 200 && g > 200) return "yellow";
  if (r > 200 && b > 200) return "magenta";
  if (g > 200 && b > 200) return "cyan";
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness > 128) return "white";
  return "gray";
}
