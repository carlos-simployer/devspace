import React, { useMemo, useEffect, useRef } from "react";
import { Box } from "ink";
import { useStore } from "zustand";
import type { TrackedPackage } from "../../api/types.ts";
import { compareDependencyByVersion } from "../../api/dependency-queries.ts";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import { FocusProvider, useFocus } from "../../ui/focus.ts";
import { DepsContext, type DepsContextValue } from "./deps-context.ts";
import { DepsListView } from "./deps-list-view.tsx";
import { depsStore } from "./deps-store.ts";

export function DepsLayout() {
  const {
    depPackages: packages,
    depFetchPackage: fetchPackage,
    config,
    contentHeight,
    width,
  } = useAppContext();
  const trackedPackages = config.trackedPackages;
  const outlet = useOutlet();

  const {
    focus,
    setFocus,
    packageIndex,
    setPackageIndex,
    resultIndex,
    setResultIndex,
  } = useStore(depsStore);

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
  useEffect(() => {
    if (selectedName) {
      fetchPackage(selectedName);
    }
  }, [selectedName, fetchPackage]);

  // Reset result index when switching packages
  useEffect(() => {
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

  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <FocusProvider initialFocus={focus}>
      <DepsContext.Provider value={ctx}>
        <FocusSync setFocus={setFocus} />
        <Box height={contentHeight} width={width}>
          {/* Main content layer — always show index view */}
          <Box height={contentHeight} width={width} flexDirection="column">
            {isOverlay ? <DepsListView /> : <Outlet />}
          </Box>

          {/* Overlay layer — dialog on top */}
          {isOverlay && (
            <Box
              position="absolute"
              width={width}
              height={contentHeight}
              alignItems="center"
              justifyContent="center"
            >
              <Outlet />
            </Box>
          )}
        </Box>
      </DepsContext.Provider>
    </FocusProvider>
  );
}

/**
 * FocusSync — syncs FocusProvider's focusedId back to the Zustand store.
 * Must be rendered inside both FocusProvider and DepsContext.Provider.
 */
function FocusSync({
  setFocus,
}: {
  setFocus: (v: "sidebar" | "list") => void;
}) {
  const { focusedId } = useFocus();
  const prevRef = useRef(focusedId);

  useEffect(() => {
    if (focusedId !== prevRef.current) {
      prevRef.current = focusedId;
      if (focusedId === "sidebar" || focusedId === "list") {
        setFocus(focusedId);
      }
    }
  }, [focusedId, setFocus]);

  return null;
}
