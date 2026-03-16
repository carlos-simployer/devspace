// Do NOT import from views/ or routes.ts to avoid circular deps
import { createContext, useContext } from "react";
import type { GraphQLClient } from "./api/client.ts";
import type {
  Config,
  RepoNode,
  TrackedPackage,
  LocalProject,
} from "./api/types.ts";
import type { GitHubNotification } from "./hooks/use-notifications.ts";

export interface AppContextValue {
  // Layout
  height: number;
  width: number;
  contentHeight: number;
  onQuit: () => void;

  // Config (full object + all mutators)
  config: Config;
  addRepo: (repo: string) => void;
  removeRepo: (repo: string) => void;
  addPackage: (pkg: string) => void;
  removePackage: (pkg: string) => void;
  addOrg: (org: string) => void;
  removeOrg: (org: string) => void;
  setRefreshInterval: (seconds: number) => void;
  markViewed: (prId: string) => void;
  setThemeName: (name: string) => void;
  setAzureOrg: (org: string) => void;
  setAzureProject: (project: string) => void;
  addPinnedPipeline: (id: number) => void;
  removePinnedPipeline: (id: number) => void;
  addPinnedReleaseDefinition: (id: number) => void;
  removePinnedReleaseDefinition: (id: number) => void;
  addLocalProject: (project: LocalProject) => void;
  removeLocalProject: (name: string) => void;
  setPersistCache: (enabled: boolean) => void;
  setJiraSite: (site: string) => void;
  setJiraEmail: (email: string) => void;
  setJiraProject: (project: string) => void;
  addSlackChannel: (channelId: string) => void;
  removeSlackChannel: (channelId: string) => void;
  isFirstLaunch: boolean;

  // GitHub data
  client: GraphQLClient;
  token: string;
  orgRepos: RepoNode[];
  reposLoading: boolean;

  // Dependency data
  depPackages: Map<string, TrackedPackage>;
  depFetchPackage: (name: string, force?: boolean) => void;

  // Notifications
  notifications: GitHubNotification[];
  notifLoading: boolean;
  unreadCount: number;
}

// Default value is never actually used — the provider always supplies a real one.
// We use null! and cast to satisfy createContext without a default.
export const AppContext = createContext<AppContextValue>(null!);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error("useAppContext must be used within AppContext.Provider");
  }
  return ctx;
}
