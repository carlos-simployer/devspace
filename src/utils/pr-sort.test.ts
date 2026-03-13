import { describe, it, expect } from "vitest";
import type { PullRequest } from "../api/types.ts";
import { prListChanged, sortPRs } from "./pr-sort.ts";

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

describe("prListChanged", () => {
  it("returns false for two empty arrays", () => {
    expect(prListChanged([], [])).toBe(false);
  });

  it("returns false for identical arrays", () => {
    const pr1 = makePR({ id: "PR_1", updatedAt: "2024-03-13T11:00:00Z" });
    const pr2 = makePR({ id: "PR_2", updatedAt: "2024-03-13T12:00:00Z" });
    const a = [pr1, pr2];
    const b = [
      makePR({ id: "PR_1", updatedAt: "2024-03-13T11:00:00Z" }),
      makePR({ id: "PR_2", updatedAt: "2024-03-13T12:00:00Z" }),
    ];
    expect(prListChanged(a, b)).toBe(false);
  });

  it("returns true when lengths differ", () => {
    const a = [makePR({ id: "PR_1" })];
    const b = [makePR({ id: "PR_1" }), makePR({ id: "PR_2" })];
    expect(prListChanged(a, b)).toBe(true);
  });

  it("returns true when an id differs", () => {
    const a = [makePR({ id: "PR_1" })];
    const b = [makePR({ id: "PR_99" })];
    expect(prListChanged(a, b)).toBe(true);
  });

  it("returns true when an updatedAt differs", () => {
    const a = [makePR({ id: "PR_1", updatedAt: "2024-03-13T11:00:00Z" })];
    const b = [makePR({ id: "PR_1", updatedAt: "2024-03-13T12:00:00Z" })];
    expect(prListChanged(a, b)).toBe(true);
  });
});

describe("sortPRs", () => {
  it("updated mode: sorts by updatedAt descending (most recent first)", () => {
    const oldest = makePR({
      id: "PR_1",
      updatedAt: "2024-01-01T00:00:00Z",
    });
    const middle = makePR({
      id: "PR_2",
      updatedAt: "2024-02-01T00:00:00Z",
    });
    const newest = makePR({
      id: "PR_3",
      updatedAt: "2024-03-01T00:00:00Z",
    });

    const result = sortPRs([oldest, newest, middle], "updated");
    expect(result.map((pr) => pr.id)).toEqual(["PR_3", "PR_2", "PR_1"]);
  });

  it("oldest mode: sorts by updatedAt ascending", () => {
    const oldest = makePR({
      id: "PR_1",
      updatedAt: "2024-01-01T00:00:00Z",
    });
    const middle = makePR({
      id: "PR_2",
      updatedAt: "2024-02-01T00:00:00Z",
    });
    const newest = makePR({
      id: "PR_3",
      updatedAt: "2024-03-01T00:00:00Z",
    });

    const result = sortPRs([newest, oldest, middle], "oldest");
    expect(result.map((pr) => pr.id)).toEqual(["PR_1", "PR_2", "PR_3"]);
  });

  it("repo-updated mode: groups by repo name, then sorts by updatedAt within each group", () => {
    const repoA_old = makePR({
      id: "PR_1",
      updatedAt: "2024-01-01T00:00:00Z",
      repository: {
        name: "alpha",
        url: "https://github.com/org/alpha",
        owner: { login: "org" },
      },
    });
    const repoA_new = makePR({
      id: "PR_2",
      updatedAt: "2024-03-01T00:00:00Z",
      repository: {
        name: "alpha",
        url: "https://github.com/org/alpha",
        owner: { login: "org" },
      },
    });
    const repoB = makePR({
      id: "PR_3",
      updatedAt: "2024-02-01T00:00:00Z",
      repository: {
        name: "beta",
        url: "https://github.com/org/beta",
        owner: { login: "org" },
      },
    });

    const result = sortPRs([repoB, repoA_old, repoA_new], "repo-updated");
    // alpha group first (alphabetically), newest first within group, then beta
    expect(result.map((pr) => pr.id)).toEqual(["PR_2", "PR_1", "PR_3"]);
  });

  it("returns a new array (does not mutate original)", () => {
    const prs = [
      makePR({ id: "PR_1", updatedAt: "2024-01-01T00:00:00Z" }),
      makePR({ id: "PR_2", updatedAt: "2024-03-01T00:00:00Z" }),
    ];
    const original = [...prs];
    const result = sortPRs(prs, "updated");
    expect(result).not.toBe(prs);
    expect(prs).toEqual(original);
  });

  it("empty array returns empty", () => {
    const result = sortPRs([], "updated");
    expect(result).toEqual([]);
  });
});
