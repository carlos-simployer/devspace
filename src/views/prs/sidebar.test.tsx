import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect } from "vitest";
import type { PullRequest } from "../../api/types.ts";
import { Sidebar } from "./sidebar.tsx";

function makePR(repoName: string, ownerLogin: string = "org"): PullRequest {
  return {
    id: `PR_${repoName}_${Math.random()}`,
    number: 1,
    title: "Test PR",
    url: `https://github.com/${ownerLogin}/${repoName}/pull/1`,
    isDraft: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    headRefName: "main",
    author: { login: "user" },
    repository: {
      name: repoName,
      url: `https://github.com/${ownerLogin}/${repoName}`,
      owner: { login: ownerLogin },
    },
    reviewDecision: null,
    latestReviews: { nodes: [] },
    reviewRequests: { totalCount: 0, nodes: [] },
    commits: {
      nodes: [{ commit: { statusCheckRollup: null } }],
    },
    labels: { nodes: [] },
    mergeable: "UNKNOWN",
    additions: 0,
    deletions: 0,
    changedFiles: 0,
  };
}

const defaultProps = {
  selectedRepo: null,
  selectedIndex: 0,
  isFocused: true,
  height: 20,
  width: 30,
  multiOrg: false,
};

describe("Sidebar", () => {
  it('renders "Repos" header', () => {
    const { lastFrame } = render(
      <Sidebar {...defaultProps} repos={[]} allPRs={[]} />,
    );
    expect(lastFrame()).toContain("Repos");
  });

  it('renders "All repos" item', () => {
    const { lastFrame } = render(
      <Sidebar {...defaultProps} repos={[]} allPRs={[]} />,
    );
    expect(lastFrame()).toContain("All repos");
  });

  it('renders "[+] Add repo" item', () => {
    const { lastFrame } = render(
      <Sidebar {...defaultProps} repos={[]} allPRs={[]} />,
    );
    expect(lastFrame()).toContain("[+] Add repo");
  });

  it("shows PR count per repo", () => {
    const allPRs = [makePR("frontend"), makePR("frontend"), makePR("backend")];
    const repos = ["org/frontend", "org/backend"];
    const { lastFrame } = render(
      <Sidebar {...defaultProps} repos={repos} allPRs={allPRs} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("frontend (2)");
    expect(frame).toContain("backend (1)");
  });

  it("renders repo names", () => {
    const repos = ["org/alpha", "org/beta"];
    const { lastFrame } = render(
      <Sidebar {...defaultProps} repos={repos} allPRs={[]} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("alpha");
    expect(frame).toContain("beta");
  });
});
