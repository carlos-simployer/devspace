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
    name?: string;
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
    nodes: Array<{
      requestedReviewer: {
        login?: string;
        name?: string;
      } | null;
    }>;
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
  owner: string; // org login
  url: string;
  isArchived: boolean;
  updatedAt: string;
}

// V1 config (legacy format for migration)
export interface ConfigV1 {
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

// V2 config (multi-org)
export interface Config {
  version: 2;
  orgs: string[];
  activeOrg: string;
  repos: string[]; // qualified: "org/repo"
  lastViewed: Record<string, number>; // PR id -> timestamp
  trackedPackages: string[];
  refreshInterval: number; // PR poll interval in seconds
  theme: string; // ThemeName — defaults to "default"
  azureOrg: string; // Azure DevOps organization
  azureProject: string; // Azure DevOps project
  pinnedPipelines: number[]; // pipeline definition IDs
  pinnedReleaseDefinitions: number[]; // release definition IDs
  localProjects: LocalProject[]; // local dev projects to start/stop
}

// --- Azure DevOps types ---

export interface AzurePipelineDefinition {
  id: number;
  name: string;
  path: string; // folder path, e.g. "\\Frontend" or "\\"
  latestBuild: AzureBuildRun | null;
}

export interface AzureBuildRun {
  id: number;
  buildNumber: string;
  status:
    | "completed"
    | "inProgress"
    | "cancelling"
    | "postponed"
    | "notStarted"
    | "none";
  result:
    | "succeeded"
    | "partiallySucceeded"
    | "failed"
    | "canceled"
    | "none"
    | null;
  sourceBranch: string;
  sourceVersion: string;
  reason: string;
  startTime: string | null;
  finishTime: string | null;
  queueTime: string;
  triggerInfo?: {
    "pr.number"?: string;
  };
  definition: {
    id: number;
    name: string;
  };
  requestedFor?: {
    displayName: string;
  };
}

export interface AzureReleaseDefinition {
  id: number;
  name: string;
  environments: Array<{
    id: number;
    name: string;
  }>;
}

export interface AzureRelease {
  id: number;
  name: string;
  createdOn: string;
  description: string;
  environments: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  artifacts: Array<{
    type: string;
    alias: string;
    definitionReference: {
      version?: { id: string; name: string };
      branch?: { id: string; name: string };
    };
  }>;
}

export const REFRESH_PRESETS = [30, 45, 60, 120] as const;

export type FilterMode = "all" | "mine" | "review" | "closed";

export type FocusArea = "sidebar" | "list";

export type AppView =
  | "prs"
  | "dependencies"
  | "config"
  | "pipelines"
  | "releases"
  | "projects";

export interface LocalProject {
  name: string;
  path: string;
  command: string;
  dependencies: string[];
  url?: string;
}

export type SortMode = "repo-updated" | "updated" | "oldest";

export interface PendingAction {
  type: "approve" | "comment" | "request-changes";
  prId: string;
  prNumber: number;
  confirmed: boolean;
}
