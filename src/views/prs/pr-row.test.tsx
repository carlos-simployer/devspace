import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect } from "vitest";
import type { PullRequest } from "../../api/types.ts";
import { PRRow } from "./pr-row.tsx";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: "PR_1",
    number: 42,
    title: "Add new feature",
    url: "https://github.com/org/repo/pull/42",
    isDraft: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    headRefName: "feature-branch",
    author: { login: "alice", name: "Alice Smith" },
    repository: {
      name: "my-repo",
      url: "https://github.com/org/my-repo",
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

// ink-testing-library uses a fixed 100-column stdout, so match that
// to avoid line-wrapping artifacts in the rendered output.
const WIDTH = 100;

describe("PRRow", () => {
  it("renders PR number", () => {
    const pr = makePR({ number: 123 });
    const { lastFrame } = render(
      <PRRow pr={pr} isSelected={false} width={WIDTH} />,
    );
    expect(lastFrame()).toContain("#123");
  });

  it("renders PR title", () => {
    const pr = makePR({ title: "Fix login bug" });
    const { lastFrame } = render(
      <PRRow pr={pr} isSelected={false} width={WIDTH} />,
    );
    expect(lastFrame()).toContain("Fix login bug");
  });

  it("renders author name", () => {
    const pr = makePR({ author: { login: "bob", name: "Bob Jones" } });
    const { lastFrame } = render(
      <PRRow pr={pr} isSelected={false} width={WIDTH} />,
    );
    expect(lastFrame()).toContain("Bob Jones");
  });

  it('shows "> " selector when isSelected=true', () => {
    const pr = makePR();
    const { lastFrame } = render(
      <PRRow pr={pr} isSelected={true} width={WIDTH} />,
    );
    expect(lastFrame()).toContain("> ");
  });

  it('shows "[DRAFT]" prefix for draft PRs', () => {
    const pr = makePR({ isDraft: true });
    const { lastFrame } = render(
      <PRRow pr={pr} isSelected={false} width={WIDTH} />,
    );
    expect(lastFrame()).toContain("[DRAFT]");
  });

  it("truncates long titles", () => {
    const longTitle = "A".repeat(200);
    const pr = makePR({ title: longTitle });
    const { lastFrame } = render(
      <PRRow pr={pr} isSelected={false} width={WIDTH} />,
    );
    const frame = lastFrame()!;
    // The full title should not appear, and an ellipsis should be present
    expect(frame).not.toContain(longTitle);
    expect(frame).toContain("…");
  });
});
