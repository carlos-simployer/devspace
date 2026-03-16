import React, { useState, useMemo } from "react";
import { Box } from "ink";
import type { FocusArea, TrackedPackage } from "../../api/types.ts";
import { compareDependencyByVersion } from "../../api/dependency-queries.ts";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import { DepsContext, type DepsContextValue } from "./deps-context.ts";

export function DepsLayout() {
  const {
    depPackages: packages,
    depFetchPackage: fetchPackage,
    config,
    contentHeight: height,
    width,
  } = useAppContext();
  const trackedPackages = config.trackedPackages;
  const outlet = useOutlet();

  const [focus, setFocus] = useState<FocusArea>("sidebar");
  const [packageIndex, setPackageIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);

  const packageList: TrackedPackage[] = useMemo(
    () =>
      trackedPackages.map(
        (name) =>
          packages.get(name) ?? {
            name,
            results: [],
            loading: false,
            error: null,
            lastRefresh: null,
          },
      ),
    [trackedPackages, packages],
  );

  const selectedPackage = packageList[packageIndex] ?? null;
  const selectedName = selectedPackage?.name ?? null;
  const selectedResults = useMemo(
    () =>
      [...(selectedPackage?.results ?? [])].sort(compareDependencyByVersion),
    [selectedPackage],
  );

  // Fetch the selected package when it changes (respects cache)
  React.useEffect(() => {
    if (selectedName) {
      fetchPackage(selectedName);
    }
  }, [selectedName, fetchPackage]);

  // Reset result index when switching packages
  React.useEffect(() => {
    setResultIndex(0);
  }, [packageIndex]);

  const ctx: DepsContextValue = {
    focus,
    setFocus,
    packageIndex,
    setPackageIndex,
    resultIndex,
    setResultIndex,
    packageList,
    selectedPackage,
    selectedResults,
    trackedPackages,
  };

  // For overlay children: center them
  if (outlet?.isOverlay) {
    return (
      <DepsContext.Provider value={ctx}>
        <Box
          height={height}
          width={width}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </DepsContext.Provider>
    );
  }

  // For full children (index): render directly
  return (
    <DepsContext.Provider value={ctx}>
      <Outlet />
    </DepsContext.Provider>
  );
}
