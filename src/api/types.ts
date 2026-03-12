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
}

export interface RepoNode {
  name: string;
  url: string;
  isArchived: boolean;
  updatedAt: string;
}

export interface Config {
  org: string;
  repos: string[];
}

export type FilterMode = "all" | "mine" | "review" | "closed";

export type FocusArea = "sidebar" | "list";
