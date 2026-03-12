import React, { useState } from "react";
import { Box, useApp } from "ink";
import { useScreenSize } from "./hooks/use-screen-size.ts";
import type { GraphQLClient } from "./api/client.ts";
import type { AppView } from "./api/types.ts";
import { useConfig } from "./hooks/use-config.ts";
import { useRepos } from "./hooks/use-repos.ts";
import { PRDashboard } from "./views/pr-dashboard.tsx";
import { DependencyTracker } from "./views/dependency-tracker.tsx";

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
    isFirstLaunch,
  } = useConfig(org);
  const { repos: orgRepos, loading: reposLoading } = useRepos(
    client,
    config.org,
  );

  const [view, setView] = useState<AppView>("prs");

  const switchView = () => {
    setView((v) => (v === "prs" ? "dependencies" : "prs"));
  };

  return (
    <Box height={height} width={width}>
      {view === "prs" ? (
        <PRDashboard
          client={client}
          org={config.org}
          repos={config.repos}
          orgRepos={orgRepos}
          reposLoading={reposLoading}
          addRepo={addRepo}
          removeRepo={removeRepo}
          isFirstLaunch={isFirstLaunch}
          onSwitchView={switchView}
          height={height}
          width={width}
          onQuit={exit}
        />
      ) : (
        <DependencyTracker
          token={token}
          org={config.org}
          trackedPackages={config.trackedPackages}
          addPackage={addPackage}
          removePackage={removePackage}
          onSwitchView={switchView}
          height={height}
          width={width}
          onQuit={exit}
        />
      )}
    </Box>
  );
}
