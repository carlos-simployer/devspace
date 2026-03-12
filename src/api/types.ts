export interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  headRefName: string;
  author: {
    login: string;
  };
  repository: {
    name: string;
    url: string;
    owner: {
      login: string;
    };
  };
  reviewDecision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  latestReviews: {
    nodes: Array<{
      state:
        | "APPROVED"
        | "CHANGES_REQUESTED"
        | "COMMENTED"
        | "DISMISSED"
        | "PENDING";
      author: { login: string };
    }>;
  };
  reviewRequests: {
    totalCount: number;
  };
  commits: {
    nodes: Array<{
      commit: {
        statusCheckRollup: {
          state:
            | "SUCCESS"
            | "FAILURE"
            | "PENDING"
            | "ERROR"
            | "EXPECTED"
            | null;
        } | null;
      };
    }>;
  };
  labels: {
    nodes: Array<{
      name: string;
      color: string;
    }>;
  };
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface RepoNode {
  name: string;
  url: string;
  isArchived: boolean;
  updatedAt: string;
}

// V1 config (legacy format for migration)
export interface ConfigV1 {
  org: string;
  repos: string[];
}

// V2 config (multi-org)
export interface Config {
  version: 2;
  orgs: string[];
  activeOrg: string;
  repos: string[]; // qualified: "org/repo"
  lastViewed: Record<string, number>; // PR id -> timestamp
}

export type FilterMode = "all" | "mine" | "review" | "closed";

export type FocusArea = "sidebar" | "list";

export type SortMode = "repo-updated" | "updated" | "oldest";

export interface PendingAction {
  type: "approve" | "comment" | "request-changes";
  prId: string;
  prNumber: number;
  confirmed: boolean;
}
