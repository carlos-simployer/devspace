import { createContext, useContext } from "react";
import type {
  PullRequest,
  FilterMode,
  FocusArea,
  SortMode,
  RepoNode,
} from "../../api/types.ts";
import type { PRDetail } from "../../hooks/use-pr-detail.ts";
import type { GitHubNotification } from "../../hooks/use-notifications.ts";
import type { GraphQLClient } from "../../api/client.ts";

export interface PrsContextValue {
  // Selection
  selectedPR: PullRequest | null;
  listIndex: number;
  setListIndex: (v: number | ((prev: number) => number)) => void;
  sidebarIndex: number;
  setSidebarIndex: (v: number | ((prev: number) => number)) => void;

  // Focus
  focus: FocusArea;
  setFocus: (v: FocusArea) => void;

  // Filters & sorting
  filterMode: FilterMode;
  setFilterMode: (v: FilterMode) => void;
  sortMode: SortMode;
  setSortMode: (v: SortMode | ((prev: SortMode) => SortMode)) => void;

  // Search
  searchText: string;
  setSearchText: (v: string | ((prev: string) => string)) => void;
  searchMode: boolean;
  setSearchMode: (v: boolean) => void;

  // Comment
  commentMode: boolean;
  setCommentMode: (v: boolean) => void;
  commentText: string;
  setCommentText: (v: string | ((prev: string) => string)) => void;
  commentType: "comment" | "request-changes";
  setCommentType: (v: "comment" | "request-changes") => void;

  // Approve
  pendingApprove: { prId: string; prNumber: number } | null;
  setPendingApprove: (v: { prId: string; prNumber: number } | null) => void;

  // Status messages
  statusMessage: string;
  showStatus: (msg: string) => void;

  // PR data
  allPRs: PullRequest[];
  prs: PullRequest[];
  loading: boolean;
  fetching: boolean;
  error: string | null;
  refetch: () => void;
  lastRefresh: Date | null;
  secondsUntilRefresh: number;

  // PR detail
  prDetail: PRDetail | null;
  detailLoading: boolean;
  detailError: string | null;

  // Notifications
  notifications: GitHubNotification[];
  notifLoading: boolean;
  unreadCount: number;

  // Config-derived
  repos: string[];
  lastViewed: Record<string, number>;
  sidebarItems: (string | null)[];
  selectedRepo: string | null;
  multiOrg: boolean;

  // Org repos
  orgRepos: RepoNode[];
  reposLoading: boolean;

  // Mutations
  addRepo: (repo: string) => void;
  removeRepo: (repo: string) => void;
  markViewed: (prId: string) => void;
  submitComment: (
    text: string,
    type: "comment" | "request-changes",
  ) => Promise<void>;

  // Client
  client: GraphQLClient;
}

export const PrsContext = createContext<PrsContextValue>(null!);

export function usePrsContext(): PrsContextValue {
  const ctx = useContext(PrsContext);
  if (ctx === null) {
    throw new Error("usePrsContext must be used within PrsContext.Provider");
  }
  return ctx;
}
