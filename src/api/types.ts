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
  trackedPackages: string[];
}

export interface DependencyResult {
  repo: string;
  repoUrl: string;
  version: string;
  branch: string;
  depType: "dependencies" | "devDependencies" | "peerDependencies";
}

export interface TrackedPackage {
  name: string;
  results: DependencyResult[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export type FilterMode = "all" | "mine" | "review" | "closed";

export type FocusArea = "sidebar" | "list";

export type AppView = "prs" | "dependencies";
