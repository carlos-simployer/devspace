import { describe, it, expect } from "vitest";
import type { PullRequest } from "../api/types.ts";
import { getReviewers, hexToAnsiColor } from "./reviewers.ts";

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
    author: { login: "prauthor" },
    repository: {
      name: "repo",
      url: "https://github.com/org/repo",
      owner: { login: "org" },
    },
    reviewDecision: null,
    latestReviews: { nodes: [] },
    reviewRequests: { totalCount: 0, nodes: [] },
    commits: {
      nodes: [{ commit: { statusCheckRollup: null } }],
    },
    labels: { nodes: [] },
    mergeable: "UNKNOWN",
    additions: 10,
    deletions: 5,
    changedFiles: 3,
    ...overrides,
  };
}

describe("getReviewers", () => {
  it("returns empty array when no reviews and no review requests", () => {
    const pr = makePR();
    expect(getReviewers(pr)).toEqual([]);
  });

  it("approved reviewer shows state approved", () => {
    const pr = makePR({
      latestReviews: {
        nodes: [{ state: "APPROVED", author: { login: "reviewer1" } }],
      },
    });
    const result = getReviewers(pr);
    expect(result).toEqual([{ name: "reviewer1", state: "approved" }]);
  });

  it("changes requested reviewer shows state changes", () => {
    const pr = makePR({
      latestReviews: {
        nodes: [{ state: "CHANGES_REQUESTED", author: { login: "reviewer1" } }],
      },
    });
    const result = getReviewers(pr);
    expect(result).toEqual([{ name: "reviewer1", state: "changes" }]);
  });

  it("commented reviewer shows state reviewed", () => {
    const pr = makePR({
      latestReviews: {
        nodes: [{ state: "COMMENTED", author: { login: "reviewer1" } }],
      },
    });
    const result = getReviewers(pr);
    expect(result).toEqual([{ name: "reviewer1", state: "reviewed" }]);
  });

  it("pending reviewer from reviewRequests", () => {
    const pr = makePR({
      reviewRequests: {
        totalCount: 1,
        nodes: [{ requestedReviewer: { login: "pending-user" } }],
      },
    });
    const result = getReviewers(pr);
    expect(result).toEqual([{ name: "pending-user", state: "pending" }]);
  });

  it("review by PR author is excluded", () => {
    const pr = makePR({
      author: { login: "prauthor" },
      latestReviews: {
        nodes: [
          { state: "COMMENTED", author: { login: "prauthor" } },
          { state: "APPROVED", author: { login: "reviewer1" } },
        ],
      },
    });
    const result = getReviewers(pr);
    expect(result).toEqual([{ name: "reviewer1", state: "approved" }]);
  });

  it("review request overridden by submitted review", () => {
    const pr = makePR({
      latestReviews: {
        nodes: [{ state: "APPROVED", author: { login: "reviewer1" } }],
      },
      reviewRequests: {
        totalCount: 1,
        nodes: [{ requestedReviewer: { login: "reviewer1" } }],
      },
    });
    const result = getReviewers(pr);
    // reviewer1 already reviewed, so should not appear as pending
    expect(result).toEqual([{ name: "reviewer1", state: "approved" }]);
    expect(result).toHaveLength(1);
  });
});

describe("hexToAnsiColor", () => {
  it("red-dominant hex returns red", () => {
    expect(hexToAnsiColor("ff0000")).toBe("red");
  });

  it("green-dominant hex returns green", () => {
    expect(hexToAnsiColor("00ff00")).toBe("green");
  });

  it("blue-dominant hex returns blue", () => {
    expect(hexToAnsiColor("0000ff")).toBe("blue");
  });

  it("yellow hex returns yellow", () => {
    // r > 200 && g > 200 and r === g so neither is dominant
    expect(hexToAnsiColor("ffff00")).toBe("yellow");
  });

  it("high brightness returns white", () => {
    // Equal high RGB values: brightness > 128, none dominant
    expect(hexToAnsiColor("c8c8c8")).toBe("white");
  });

  it("low brightness returns gray", () => {
    // Equal low RGB values: brightness < 128, none dominant
    expect(hexToAnsiColor("333333")).toBe("gray");
  });
});
