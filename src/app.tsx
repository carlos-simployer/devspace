import React, { useState, useRef, useEffect } from "react";
import { Box, useApp, measureElement } from "ink";
import type { DOMElement } from "ink";
import { useScreenSize } from "./hooks/use-screen-size.ts";
import type { GraphQLClient } from "./api/client.ts";
import type { AppView } from "./api/types.ts";
import { useConfig } from "./hooks/use-config.ts";
import { useRepos } from "./hooks/use-repos.ts";
import { useNotifications } from "./hooks/use-notifications.ts";
import { useDependencySearch } from "./hooks/use-dependency-search.ts";
import { PRView } from "./views/prs/index.tsx";
import { DependencyTracker } from "./views/dependencies/index.tsx";
import { ConfigView } from "./views/config/index.tsx";
import { PipelinesView } from "./views/pipelines/index.tsx";
import { ReleasesView } from "./views/releases/index.tsx";
import { Shortcuts } from "./components/shortcuts.tsx";
import { TabBar } from "./components/tab-bar.tsx";

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

  const [view, setView] = useState<AppView>("prs");

  // Layout measurement for view headers
  const viewHeaderRef = useRef<DOMElement>(null);
  const [measuredViewHeader, setMeasuredViewHeader] = useState(2);

  useEffect(() => {
    if (viewHeaderRef.current) {
      setMeasuredViewHeader(measureElement(viewHeaderRef.current).height);
    }
  });

  const VIEWS: AppView[] = [
    "prs",
    "dependencies",
    "pipelines",
    "releases",
    "config",
  ];

  const switchView = (target?: AppView, reverse?: boolean) => {
    if (target) {
      setView(target);
    } else {
      setView((v) => {
        const idx = VIEWS.indexOf(v);
        const next = reverse
          ? (idx - 1 + VIEWS.length) % VIEWS.length
          : (idx + 1) % VIEWS.length;
        return VIEWS[next]!;
      });
    }
  };

  if (view === "prs") {
    return (
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
        onSwitchView={switchView}
        onQuit={exit}
        height={height}
        width={width}
      />
    );
  }

  if (view === "dependencies") {
    return (
      <Box height={height} width={width} flexDirection="column">
        <Box
          ref={viewHeaderRef}
          flexDirection="column"
          paddingX={1}
          borderStyle="single"
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderBottom
        >
          <TabBar activeView={view} />
          <Shortcuts
            items={[
              { key: "+", label: "Add" },
              { key: "d", label: "Remove" },
              { key: "R", label: "Refresh" },
              { key: "o", label: "Open" },
              { key: "?", label: "Help" },
            ]}
          />
        </Box>
        <DependencyTracker
          packages={depPackages}
          fetchPackage={depFetchPackage}
          trackedPackages={config.trackedPackages}
          addPackage={addPackage}
          removePackage={removePackage}
          onSwitchView={switchView}
          height={height - measuredViewHeader}
          width={width}
          onQuit={exit}
        />
      </Box>
    );
  }

  if (view === "pipelines") {
    return (
      <Box height={height} width={width} flexDirection="column">
        <Box
          ref={viewHeaderRef}
          flexDirection="column"
          paddingX={1}
          borderStyle="single"
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderBottom
        >
          <TabBar activeView={view} />
          <Shortcuts
            items={[
              { key: "+", label: "Add" },
              { key: "d", label: "Remove" },
              { key: "p", label: "Runs" },
              { key: "o", label: "Open" },
              { key: "R", label: "Refresh" },
              { key: "?", label: "Help" },
            ]}
          />
        </Box>
        <PipelinesView
          config={config}
          addPinnedPipeline={addPinnedPipeline}
          removePinnedPipeline={removePinnedPipeline}
          onSwitchView={switchView}
          height={height - measuredViewHeader}
          width={width}
          onQuit={exit}
        />
      </Box>
    );
  }

  if (view === "releases") {
    return (
      <Box height={height} width={width} flexDirection="column">
        <Box
          ref={viewHeaderRef}
          flexDirection="column"
          paddingX={1}
          borderStyle="single"
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderBottom
        >
          <TabBar activeView={view} />
          <Shortcuts
            items={[
              { key: "+", label: "Add" },
              { key: "d", label: "Remove" },
              { key: "o", label: "Open" },
              { key: "R", label: "Refresh" },
              { key: "?", label: "Help" },
            ]}
          />
        </Box>
        <ReleasesView
          config={config}
          addPinnedReleaseDefinition={addPinnedReleaseDefinition}
          removePinnedReleaseDefinition={removePinnedReleaseDefinition}
          onSwitchView={switchView}
          height={height - measuredViewHeader}
          width={width}
          onQuit={exit}
        />
      </Box>
    );
  }

  // Config view
  return (
    <Box height={height} width={width} flexDirection="column">
      <Box
        ref={viewHeaderRef}
        flexDirection="column"
        paddingX={1}
        borderStyle="single"
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderBottom
      >
        <TabBar activeView={view} />
        <Shortcuts
          items={[
            { key: "+", label: "Add" },
            { key: "d", label: "Remove" },
            { key: "↵", label: "Select" },
            { key: "?", label: "Help" },
          ]}
        />
      </Box>
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
        height={height - measuredViewHeader}
        width={width}
        onQuit={exit}
      />
    </Box>
  );
}
