import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Box, Text, useApp, useInput, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useScreenSize } from "./hooks/use-screen-size.ts";
import type { GraphQLClient } from "./api/client.ts";
import { useConfig } from "./hooks/use-config.ts";
import { useRepos } from "./hooks/use-repos.ts";
import { useNotifications } from "./hooks/use-notifications.ts";
import { useDependencySearch } from "./hooks/use-dependency-search.ts";
import { useLocalProcesses } from "./hooks/use-local-processes.ts";
import { ViewHeader } from "./components/view-header.tsx";
import { QuitConfirm } from "./components/quit-confirm.tsx";
import { RouterProvider, RouteRenderer, useRouter } from "./ui/router.ts";
import { AppContext } from "./app-context.ts";
import { useTerminalTitle } from "./hooks/use-terminal-title.ts";
import { routes } from "./routes.ts";
import { setActiveTabs } from "./ui/tabs.ts";
import { exec as execCmd } from "child_process";
import { getTheme } from "./ui/theme.ts";
import { DEFAULT_CONFIG_DIR } from "./constants.ts";

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
    setJiraProject,
    addSlackChannel,
    removeSlackChannel,
    setEnabledTabs,
    isFirstLaunch,
    configErrors,
  } = configHook;

  // Sync tab visibility/order with config
  setActiveTabs(config.enabledTabs);

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

  const {
    states: processStates,
    startCommand,
    startAll,
    stopOne,
    stopAll,
    restartCommand,
    clearLogs,
    getProjectStatus,
    getDependents,
  } = useLocalProcesses(config.localProjects);

  // Router — all views use router for sub-navigation
  const { route, baseRoute } = useRouter();

  // Update terminal tab title to reflect current view
  useTerminalTitle(route);

  // Quit confirmation
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const hasRunningProcesses = config.localProjects.length > 0;
  const requestQuit = useCallback(() => setShowQuitConfirm(true), []);
  const cancelQuit = useCallback(() => setShowQuitConfirm(false), []);

  // Layout measurement for the shared header
  const viewHeaderRef = useRef<DOMElement>(null);
  const [measuredViewHeader, setMeasuredViewHeader] = useState(4);

  useEffect(() => {
    if (viewHeaderRef.current) {
      const h = measureElement(viewHeaderRef.current).height;
      setMeasuredViewHeader((prev) => (prev === h ? prev : h));
    }
  });

  const contentHeight = height - measuredViewHeader;

  const appCtx = useMemo(
    () => ({
      height,
      width,
      contentHeight,
      onQuit: requestQuit,
      config,
      configErrors,
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
      setJiraProject,
      addSlackChannel,
      removeSlackChannel,
      setEnabledTabs,
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
      processStates,
      startCommand,
      startAll,
      stopOne,
      stopAll,
      restartCommand,
      clearLogs,
      getProjectStatus,
      getDependents,
    }),
    [
      height,
      width,
      contentHeight,
      requestQuit,
      config,
      configErrors,
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
      setJiraProject,
      addSlackChannel,
      removeSlackChannel,
      setEnabledTabs,
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
      processStates,
      startCommand,
      startAll,
      stopOne,
      stopAll,
      restartCommand,
      clearLogs,
      getProjectStatus,
      getDependents,
    ],
  );

  // Config error screen — show before anything else
  useInput(
    (input) => {
      if (configErrors.length === 0) return;
      if (input === "e") {
        execCmd(`code "${DEFAULT_CONFIG_DIR}/config.json"`);
      }
      if (input === "q") exit();
    },
    { isActive: configErrors.length > 0 },
  );

  if (configErrors.length > 0) {
    const theme = getTheme();
    return (
      <Box
        height={height}
        width={width}
        flexDirection="column"
        paddingX={2}
        paddingY={1}
      >
        <Text bold color={theme.status.failure}>
          Configuration Error
        </Text>
        <Text dimColor>
          {DEFAULT_CONFIG_DIR}/config.json has invalid values:
        </Text>
        <Box flexDirection="column" marginTop={1} marginBottom={1}>
          {configErrors.map((err, i) => (
            <Box key={i}>
              <Text color={theme.status.failure}>{"\u2022"} </Text>
              <Text bold>{err.path}</Text>
              <Text dimColor> — {err.message}</Text>
            </Box>
          ))}
        </Box>
        <Text dimColor>
          Press <Text bold>e</Text> to open config in VS Code |{" "}
          <Text bold>q</Text> to quit
        </Text>
      </Box>
    );
  }

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

  return (
    <AppContext.Provider value={appCtx}>
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader route={route} width={width} headerRef={viewHeaderRef} />
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
