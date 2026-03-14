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
import { ViewHeader } from "./components/view-header.tsx";
import type { ViewId, BaseView } from "./ui/view-config.ts";
import { getBaseView } from "./ui/view-config.ts";
import { ViewContext } from "./ui/view-context.ts";

interface Props {
  client: GraphQLClient;
  org?: string;
  token: string;
}

export function App({ client, org, token }: Props) {
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

  const [view, setViewRaw] = useState<ViewId>("prs");
  const baseView = getBaseView(view);

  // When switching base views, reset to the base
  const setView = (v: ViewId) => setViewRaw(v);

  // Legacy switchView for views not yet migrated
  const switchView = (target?: string, reverse?: boolean) => {
    if (target) {
      setViewRaw(target as ViewId);
    } else {
      const VIEWS: BaseView[] = [
        "prs",
        "dependencies",
        "pipelines",
        "releases",
        "projects",
        "config",
      ];
      const idx = VIEWS.indexOf(baseView);
      const next = reverse
        ? (idx - 1 + VIEWS.length) % VIEWS.length
        : (idx + 1) % VIEWS.length;
      setViewRaw(VIEWS[next]!);
    }
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

  // PRView still manages its own header (will be migrated later)
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
        <ViewHeader view={view} headerRef={viewHeaderRef} />

        {baseView === "dependencies" && (
          <DependencyTracker
            packages={depPackages}
            fetchPackage={depFetchPackage}
            trackedPackages={config.trackedPackages}
            addPackage={addPackage}
            removePackage={removePackage}
            onSwitchView={switchView}
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
            onSwitchView={switchView}
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
            onSwitchView={switchView}
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
            onSwitchView={switchView}
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
            onSwitchView={switchView}
            height={contentHeight}
            width={width}
            onQuit={exit}
          />
        )}
      </Box>
    </ViewContext.Provider>
  );
}
