import { describe, it, expect } from "vitest";
import type { PullRequest } from "../api/types.ts";
import { getReviewStatus, getCIStatus, getMergeableStatus } from "./status.ts";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: "PR_1",
    number: 1,
    title: "Test PR",
    url: "https://github.com/org/repo/pull/1",
    isDraft: false,
    createdAt: "2024-03-13T10:00:00Z",
    updatedAt: "2024-03-13T11:00:00Z",
    headRefName: "feature-branch",
    author: { login: "testuser" },
    repository: {
      name: "repo",
      url: "https://github.com/org/repo",
      owner: { login: "org" },
    },
    reviewDecision: null,
    latestReviews: { nodes: [] },
    reviewRequests: { totalCount: 0, nodes: [] },
    commits: {
      nodes: [
        {
          commit: {
            statusCheckRollup: null,
          },
        },
      ],
    },
    labels: { nodes: [] },
    mergeable: "UNKNOWN",
    additions: 10,
    deletions: 5,
    changedFiles: 3,
    ...overrides,
  };
}

describe("getReviewStatus", () => {
  it("returns green check for APPROVED", () => {
    const pr = makePR({ reviewDecision: "APPROVED" });
    expect(getReviewStatus(pr)).toEqual({ icon: "✓", color: "green" });
  });

  it("returns red X for CHANGES_REQUESTED", () => {
    const pr = makePR({ reviewDecision: "CHANGES_REQUESTED" });
    expect(getReviewStatus(pr)).toEqual({ icon: "✗", color: "red" });
  });

  it("returns yellow circle for REVIEW_REQUIRED", () => {
    const pr = makePR({ reviewDecision: "REVIEW_REQUIRED" });
    expect(getReviewStatus(pr)).toEqual({ icon: "◌", color: "yellow" });
  });

  it("returns yellow circle when reviewDecision is null but review requests exist", () => {
    const pr = makePR({
      reviewDecision: null,
      reviewRequests: { totalCount: 2, nodes: [] },
    });
    expect(getReviewStatus(pr)).toEqual({ icon: "◌", color: "yellow" });
  });

  it("returns gray dash when reviewDecision is null and no review requests", () => {
    const pr = makePR({
      reviewDecision: null,
      reviewRequests: { totalCount: 0, nodes: [] },
    });
    expect(getReviewStatus(pr)).toEqual({ icon: "—", color: "gray" });
  });
});

describe("getCIStatus", () => {
  it("returns green check for SUCCESS", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: { state: "SUCCESS" } } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "✓", color: "green" });
  });

  it("returns red X for FAILURE", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: { state: "FAILURE" } } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "✗", color: "red" });
  });

  it("returns red X for ERROR", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: { state: "ERROR" } } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "✗", color: "red" });
  });

  it("returns yellow dot for PENDING", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: { state: "PENDING" } } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "●", color: "yellow" });
  });

  it("returns yellow dot for EXPECTED", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: { state: "EXPECTED" } } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "●", color: "yellow" });
  });

  it("returns gray dash when rollup state is null", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: { state: null } } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "—", color: "gray" });
  });

  it("returns gray dash when statusCheckRollup is null", () => {
    const pr = makePR({
      commits: {
        nodes: [{ commit: { statusCheckRollup: null } }],
      },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "—", color: "gray" });
  });

  it("returns gray dash when commits nodes array is empty", () => {
    const pr = makePR({
      commits: { nodes: [] },
    });
    expect(getCIStatus(pr)).toEqual({ icon: "—", color: "gray" });
  });
});

describe("getMergeableStatus", () => {
  it("returns red bang for CONFLICTING", () => {
    const pr = makePR({ mergeable: "CONFLICTING" });
    expect(getMergeableStatus(pr)).toEqual({ icon: "!", color: "red" });
  });

  it("returns gray question mark for UNKNOWN", () => {
    const pr = makePR({ mergeable: "UNKNOWN" });
    expect(getMergeableStatus(pr)).toEqual({ icon: "?", color: "gray" });
  });

  it("returns green check for MERGEABLE", () => {
    const pr = makePR({ mergeable: "MERGEABLE" });
    expect(getMergeableStatus(pr)).toEqual({ icon: "✓", color: "green" });
  });
});
