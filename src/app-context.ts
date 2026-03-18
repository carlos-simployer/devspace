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
import type { ConfigError } from "./hooks/use-config.ts";
import type {
  ProcessState,
  ProcessStatus,
} from "./hooks/use-local-processes.ts";

export interface AppContextValue {
  // Layout
  height: number;
  width: number;
  contentHeight: number;
  onQuit: () => void;

  // Config (full object + all mutators)
  config: Config;
  configErrors: ConfigError[];
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
  setEnabledTabs: (tabs: string[]) => void;
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

  // Local processes (persisted across tab switches)
  processStates: Record<string, ProcessState>;
  startCommand: (projectName: string, commandName: string) => void;
  startAll: (projectName: string) => void;
  stopOne: (projectName: string, commandName: string) => void;
  stopAll: (projectName: string) => void;
  restartCommand: (projectName: string, commandName: string) => void;
  clearLogs: (projectName: string, commandName: string) => void;
  getProjectStatus: (projectName: string) => ProcessStatus;
  getDependents: (name: string) => string[];
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
