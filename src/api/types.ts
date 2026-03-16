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
  persistCache: boolean; // persist React Query cache to disk
  jiraSite: string; // e.g. "simployer.atlassian.net"
  jiraEmail: string; // e.g. "user@company.com"
  jiraProject: string; // e.g. "UUX"
  jiraStatusOrder: string[]; // e.g. ["In Progress", "In Review", "To Do", "Done"]
  jiraAccountId: string; // for "my issues" filter
  slackChannels: string[]; // subscribed Slack channel IDs
  enabledTabs: string[]; // ordered list of enabled tab routes (empty = all, config always last)
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
  | "projects"
  | "jira"
  | "slack"
  | "about";

export interface ProjectCommand {
  name: string;
  command: string;
  cwd?: string;
  url?: string;
  dependencies?: string[];
}

export interface LocalProject {
  name: string;
  path: string;
  commands: ProjectCommand[];
}

/** Legacy shape (v1 — single command per project). */
export interface LocalProjectV1 {
  name: string;
  path: string;
  command: string;
  dependencies: string[];
  url?: string;
}

// --- Jira types ---

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string; // "new" | "indeterminate" | "done"
    name: string;
  };
}

export interface JiraIssueType {
  id: string;
  name: string; // "Task", "Bug", "Story", "Epic", "Sub-task"
  subtask: boolean;
  hierarchyLevel: number;
}

export interface JiraPriority {
  id: string;
  name: string; // "Highest", "High", "Medium", "Low", "Lowest"
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: any; // Atlassian Document Format (ADF)
  created: string;
  updated: string;
}

export interface JiraIssue {
  id: string;
  key: string; // e.g. "UUX-1629"
  fields: {
    summary: string;
    status: JiraStatus;
    issuetype: JiraIssueType;
    priority: JiraPriority;
    assignee: JiraUser | null;
    reporter: JiraUser | null;
    created: string;
    updated: string;
    labels: string[];
    description?: any; // ADF
    comment?: { comments: JiraComment[] };
    subtasks?: Array<{
      id: string;
      key: string;
      fields: {
        summary: string;
        status: JiraStatus;
        issuetype: JiraIssueType;
      };
    }>;
    parent?: { key: string; fields: { summary: string } };
    fixVersions?: Array<{ name: string }>;
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
    statusCategory: {
      id: number;
      key: string;
      name: string;
    };
  };
}

export type JiraFilterMode = "mine" | "team" | "person";

// --- Slack types ---

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: SlackReaction[];
  edited?: { user: string; ts: string };
  subtype?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  unread_count?: number;
  last_read?: string;
  latest?: SlackMessage;
  user?: string; // for DMs — the other user's ID
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  display_name: string;
  profile: {
    status_text: string;
    status_emoji: string;
    image_24?: string;
    image_48?: string;
  };
  is_bot: boolean;
  deleted: boolean;
}

export interface SlackPresence {
  presence: "active" | "away";
  online: boolean;
}

export interface SlackHistoryResponse {
  ok: boolean;
  messages: SlackMessage[];
  has_more: boolean;
  response_metadata?: { next_cursor: string };
  error?: string;
}

export interface SlackRepliesResponse {
  ok: boolean;
  messages: SlackMessage[];
  has_more: boolean;
  error?: string;
}

export interface SlackConversationListResponse {
  ok: boolean;
  channels: SlackChannel[];
  response_metadata?: { next_cursor: string };
  error?: string;
}

export interface SlackPostMessageResponse {
  ok: boolean;
  ts: string;
  channel: string;
  error?: string;
}

export interface SlackAuthInfo {
  ok: boolean;
  user_id: string;
  team_id: string;
  team: string;
  user: string;
  error?: string;
}

export type SortMode = "repo-updated" | "updated" | "oldest";
