import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Box, useApp, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useScreenSize } from "./hooks/use-screen-size.ts";
import type { GraphQLClient } from "./api/client.ts";
import { useConfig } from "./hooks/use-config.ts";
import { useRepos } from "./hooks/use-repos.ts";
import { useNotifications } from "./hooks/use-notifications.ts";
import { useDependencySearch } from "./hooks/use-dependency-search.ts";
import { ViewHeader } from "./components/view-header.tsx";
import { QuitConfirm } from "./components/quit-confirm.tsx";
import { RouterProvider, RouteRenderer, useRouter } from "./ui/router.ts";
import { AppContext } from "./app-context.ts";
import { routes } from "./routes.ts";

interface Props {
  client: GraphQLClient;
  org?: string;
  token: string;
}

/**
 * Inner app — lives inside RouterProvider so it can use the router.
 * Provides AppContext to all views.
 */
function AppInner({ client, org, token }: Props) {
  const { exit } = useApp();
  const { height, width } = useScreenSize();
  const configHook = useConfig(org);
  const {
    config,
    addRepo,
    removeRepo,
    addPackage,
    removePackage,
    addOrg,
    removeOrg,
    setRefreshInterval,
    markViewed,
    setThemeName,
    setAzureOrg,
    setAzureProject,
    addPinnedPipeline,
    removePinnedPipeline,
    addPinnedReleaseDefinition,
    removePinnedReleaseDefinition,
    addLocalProject,
    removeLocalProject,
    setPersistCache,
    setJiraSite,
    setJiraEmail,
    setJiraToken,
    setJiraProject,
    setGithubToken,
    setAzureToken,
    isFirstLaunch,
  } = configHook;

  const { repos: orgRepos, loading: reposLoading } = useRepos(
    client,
    config.orgs,
  );
  const { packages: depPackages, fetchPackage: depFetchPackage } =
    useDependencySearch(token, config.orgs, config.trackedPackages);
  const {
    notifications,
    loading: notifLoading,
    unreadCount,
  } = useNotifications(token);

  // Router — all views use router for sub-navigation
  const { route, baseRoute } = useRouter();

  // Quit confirmation
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const hasRunningProcesses = config.localProjects.length > 0;
  const requestQuit = useCallback(() => setShowQuitConfirm(true), []);
  const cancelQuit = useCallback(() => setShowQuitConfirm(false), []);

  // Layout measurement for the shared header
  const viewHeaderRef = useRef<DOMElement>(null);
  const [measuredViewHeader, setMeasuredViewHeader] = useState(3);

  useEffect(() => {
    if (viewHeaderRef.current) {
      const h = measureElement(viewHeaderRef.current).height;
      setMeasuredViewHeader((prev) => (prev === h ? prev : h));
    }
  });

  const contentHeight =
    baseRoute === "prs" ? height : height - measuredViewHeader;

  const appCtx = useMemo(
    () => ({
      height,
      width,
      contentHeight,
      onQuit: requestQuit,
      config,
      addRepo,
      removeRepo,
      addPackage,
      removePackage,
      addOrg,
      removeOrg,
      setRefreshInterval,
      markViewed,
      setThemeName,
      setAzureOrg,
      setAzureProject,
      addPinnedPipeline,
      removePinnedPipeline,
      addPinnedReleaseDefinition,
      removePinnedReleaseDefinition,
      addLocalProject,
      removeLocalProject,
      setPersistCache,
      setJiraSite,
      setJiraEmail,
      setJiraToken,
      setJiraProject,
      setGithubToken,
      setAzureToken,
      isFirstLaunch,
      client,
      token,
      orgRepos,
      reposLoading,
      depPackages,
      depFetchPackage,
      notifications,
      notifLoading,
      unreadCount,
    }),
    [
      height,
      width,
      contentHeight,
      requestQuit,
      config,
      addRepo,
      removeRepo,
      addPackage,
      removePackage,
      addOrg,
      removeOrg,
      setRefreshInterval,
      markViewed,
      setThemeName,
      setAzureOrg,
      setAzureProject,
      addPinnedPipeline,
      removePinnedPipeline,
      addPinnedReleaseDefinition,
      removePinnedReleaseDefinition,
      addLocalProject,
      removeLocalProject,
      setPersistCache,
      setJiraSite,
      setJiraEmail,
      setJiraToken,
      setJiraProject,
      setGithubToken,
      setAzureToken,
      isFirstLaunch,
      client,
      token,
      orgRepos,
      reposLoading,
      depPackages,
      depFetchPackage,
      notifications,
      notifLoading,
      unreadCount,
    ],
  );

  // Quit confirmation overlay
  if (showQuitConfirm) {
    return (
      <AppContext.Provider value={appCtx}>
        <Box
          height={height}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <QuitConfirm
            hasRunningProcesses={hasRunningProcesses}
            onConfirm={exit}
            onCancel={cancelQuit}
          />
        </Box>
      </AppContext.Provider>
    );
  }

  // PRView manages its own header — render it without ViewHeader wrapper
  if (baseRoute === "prs") {
    return (
      <AppContext.Provider value={appCtx}>
        <RouteRenderer routes={routes} />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={appCtx}>
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader route={route} headerRef={viewHeaderRef} />
        <RouteRenderer routes={routes} />
      </Box>
    </AppContext.Provider>
  );
}

/**
 * Top-level App component — wraps everything in RouterProvider.
 */
export function App({ client, org, token }: Props) {
  return (
    <RouterProvider routes={routes} initialRoute="prs">
      <AppInner client={client} org={org} token={token} />
    </RouterProvider>
  );
}
