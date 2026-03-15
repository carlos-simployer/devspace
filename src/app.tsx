import React, { useState, useRef, useEffect, useMemo } from "react";
import { Box, useApp, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useScreenSize } from "./hooks/use-screen-size.ts";
import type { GraphQLClient } from "./api/client.ts";
import { useConfig } from "./hooks/use-config.ts";
import { useRepos } from "./hooks/use-repos.ts";
import { useNotifications } from "./hooks/use-notifications.ts";
import { useDependencySearch } from "./hooks/use-dependency-search.ts";
import { PRView } from "./views/prs/index.tsx";
import { DependencyTracker } from "./views/dependencies/index.tsx";
import { ConfigView } from "./views/config/index.tsx";
import { PipelinesView } from "./views/pipelines/index.tsx";
import { ReleasesView } from "./views/releases/index.tsx";
import { ProjectsView } from "./views/projects/index.tsx";
import { JiraView } from "./views/jira/index.tsx";
import { ViewHeader } from "./components/view-header.tsx";
import type { ViewId, BaseView } from "./ui/view-config.ts";
import { ViewContext } from "./ui/view-context.ts";
import { RouterProvider, defineRoutes, useRouter } from "./ui/router.ts";

// Placeholder component for route definitions (not rendered via RouteRenderer)
const Noop = () => null;

// All routes — used by RouterProvider for param extraction and route matching
const routes = defineRoutes({
  // PRs
  prs: { component: Noop },
  "prs/detail": { component: Noop },
  "prs/help": { component: Noop, layout: "overlay" },
  "prs/notifications": { component: Noop },
  "prs/search": { component: Noop, layout: "overlay" },

  // Dependencies
  dependencies: { component: Noop },
  "dependencies/help": { component: Noop, layout: "overlay" },
  "dependencies/search": { component: Noop, layout: "overlay" },

  // Pipelines
  pipelines: { component: Noop },
  "pipelines/help": { component: Noop, layout: "overlay" },
  "pipelines/search": { component: Noop, layout: "overlay" },
  "pipelines/runs": { component: Noop },

  // Releases
  releases: { component: Noop },
  "releases/help": { component: Noop, layout: "overlay" },
  "releases/search": { component: Noop, layout: "overlay" },

  // Projects
  projects: { component: Noop },
  "projects/help": { component: Noop, layout: "overlay" },
  "projects/add": { component: Noop, layout: "overlay" },
  "projects/confirm": { component: Noop, layout: "overlay" },

  // Jira
  jira: { component: Noop },
  "jira/detail/:key": { component: Noop },
  "jira/statusFilter": { component: Noop, layout: "overlay" },
  "jira/memberSelect": { component: Noop, layout: "overlay" },
  "jira/sort": { component: Noop, layout: "overlay" },
  "jira/help": { component: Noop, layout: "overlay" },
  "jira/search": { component: Noop },

  // Config
  config: { component: Noop },
  "config/addOrg": { component: Noop, layout: "overlay" },
  "config/editAzureOrg": { component: Noop, layout: "overlay" },
  "config/editAzureProject": { component: Noop, layout: "overlay" },
  "config/editJiraSite": { component: Noop, layout: "overlay" },
  "config/editJiraEmail": { component: Noop, layout: "overlay" },
  "config/editJiraToken": { component: Noop, layout: "overlay" },
  "config/editJiraProject": { component: Noop, layout: "overlay" },
});

interface Props {
  client: GraphQLClient;
  org?: string;
  token: string;
}

/**
 * Inner app — lives inside RouterProvider so it can sync ViewContext ↔ Router.
 */
function AppInner({ client, org, token }: Props) {
  const { exit } = useApp();
  const { height, width } = useScreenSize();
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
    setJiraAccountId,
    setGithubToken,
    setAzureToken,
    isFirstLaunch,
  } = useConfig(org);
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
  const { route, navigate: routerNavigate, baseRoute } = useRouter();

  // Derive view and baseView from the router for ViewContext compatibility
  const view = route.replace(/\//g, ".") as ViewId;
  const baseView = baseRoute as BaseView;
  const setView = (v: ViewId) => {
    routerNavigate(v.replace(/\./g, "/"));
  };

  // Layout measurement for the shared header
  const viewHeaderRef = useRef<DOMElement>(null);
  const [measuredViewHeader, setMeasuredViewHeader] = useState(3);

  useEffect(() => {
    if (viewHeaderRef.current) {
      setMeasuredViewHeader(measureElement(viewHeaderRef.current).height);
    }
  });

  const viewCtx = useMemo(
    () => ({ view, setView, baseView }),
    [view, baseView],
  );

  const contentHeight = height - measuredViewHeader;

  // PRView still manages its own header
  if (baseView === "prs") {
    return (
      <ViewContext.Provider value={viewCtx}>
        <PRView
          client={client}
          token={token}
          config={config}
          addRepo={addRepo}
          removeRepo={removeRepo}
          markViewed={markViewed}
          isFirstLaunch={isFirstLaunch}
          orgRepos={orgRepos}
          reposLoading={reposLoading}
          notifications={notifications}
          notifLoading={notifLoading}
          unreadCount={unreadCount}
          onQuit={exit}
          height={height}
          width={width}
        />
      </ViewContext.Provider>
    );
  }

  return (
    <ViewContext.Provider value={viewCtx}>
      <Box height={height} width={width} flexDirection="column">
        <ViewHeader view={view} route={route} headerRef={viewHeaderRef} />

        {baseView === "dependencies" && (
          <DependencyTracker
            packages={depPackages}
            fetchPackage={depFetchPackage}
            trackedPackages={config.trackedPackages}
            addPackage={addPackage}
            removePackage={removePackage}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}

        {baseView === "pipelines" && (
          <PipelinesView
            config={config}
            addPinnedPipeline={addPinnedPipeline}
            removePinnedPipeline={removePinnedPipeline}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}

        {baseView === "releases" && (
          <ReleasesView
            config={config}
            addPinnedReleaseDefinition={addPinnedReleaseDefinition}
            removePinnedReleaseDefinition={removePinnedReleaseDefinition}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}

        {baseView === "projects" && (
          <ProjectsView
            localProjects={config.localProjects}
            addLocalProject={addLocalProject}
            removeLocalProject={removeLocalProject}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}

        {baseView === "jira" && (
          <JiraView
            config={config}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}

        {baseView === "config" && (
          <ConfigView
            orgs={config.orgs}
            addOrg={addOrg}
            removeOrg={removeOrg}
            refreshInterval={config.refreshInterval}
            setRefreshInterval={setRefreshInterval}
            themeName={config.theme}
            setThemeName={setThemeName}
            azureOrg={config.azureOrg}
            azureProject={config.azureProject}
            setAzureOrg={setAzureOrg}
            setAzureProject={setAzureProject}
            jiraSite={config.jiraSite}
            jiraEmail={config.jiraEmail}
            jiraToken={config.jiraToken}
            jiraProject={config.jiraProject}
            setJiraSite={setJiraSite}
            setJiraEmail={setJiraEmail}
            setJiraToken={setJiraToken}
            setJiraProject={setJiraProject}
            githubToken={config.githubToken}
            setGithubToken={setGithubToken}
            azureToken={config.azureToken}
            setAzureToken={setAzureToken}
            persistCache={config.persistCache}
            setPersistCache={setPersistCache}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}
      </Box>
    </ViewContext.Provider>
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
