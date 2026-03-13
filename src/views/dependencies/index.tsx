import React, { useState, useCallback, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import type { AppView, FocusArea, TrackedPackage } from "../../api/types.ts";
import { handleGlobalKeys } from "../../hooks/use-global-keys.ts";
import { PackageList } from "./package-list.tsx";
import { DepResults } from "./dep-results.tsx";
import { DepStatusBar } from "./dep-status-bar.tsx";
import { PackageSearch } from "./package-search.tsx";
import { HelpOverlay } from "../../components/help-overlay.tsx";

interface Props {
  packages: Map<string, TrackedPackage>;
  fetchPackage: (name: string, force?: boolean) => void;
  trackedPackages: string[];
  addPackage: (pkg: string) => void;
  removePackage: (pkg: string) => void;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  height: number;
  width: number;
  onQuit: () => void;
}

export function DependencyTracker({
  packages,
  fetchPackage,
  trackedPackages,
  addPackage,
  removePackage,
  onSwitchView,
  height,
  width,
  onQuit,
}: Props) {
  const [focus, setFocus] = useState<FocusArea>("sidebar");
  const [packageIndex, setPackageIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [showPackageSearch, setShowPackageSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
    () => selectedPackage?.results ?? [],
    [selectedPackage],
  );

  // Fetch the selected package when it changes (respects cache)
  React.useEffect(() => {
    if (selectedName) {
      fetchPackage(selectedName);
    }
  }, [selectedName, fetchPackage]);

  const openInBrowser = useCallback(async (url: string) => {
    const { default: open } = await import("open");
    await open(url);
  }, []);

  useInput((input, key) => {
    if (showPackageSearch) return;

    if (showHelp) {
      if (input === "?" || key.escape) setShowHelp(false);
      return;
    }

    if (
      handleGlobalKeys(input, key, {
        onQuit,
        onSwitchView,
        onHelp: () => setShowHelp(true),
      })
    )
      return;

    if (input === "R") {
      if (selectedName) fetchPackage(selectedName, true);
      return;
    }

    if (input === "+") {
      setShowPackageSearch(true);
      return;
    }

    // Focus switching
    if (key.leftArrow) {
      setFocus("sidebar");
      return;
    }
    if (key.rightArrow) {
      setFocus("list");
      return;
    }

    // Navigation
    if (focus === "sidebar") {
      const maxIdx = trackedPackages.length; // +1 for "[+] Add"
      if (key.upArrow) setPackageIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setPackageIndex((i) => Math.min(maxIdx, i + 1));

      if (key.return || input === "o") {
        if (packageIndex === trackedPackages.length) {
          setShowPackageSearch(true);
          return;
        }
      }

      if (
        (input === "d" || input === "-") &&
        packageIndex < trackedPackages.length
      ) {
        const pkg = trackedPackages[packageIndex];
        if (pkg) {
          removePackage(pkg);
          setPackageIndex((i) => Math.max(0, i - 1));
        }
      }
    }

    if (focus === "list" && selectedPackage) {
      const maxIdx = selectedPackage.results.length - 1;
      if (key.upArrow) setResultIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setResultIndex((i) => Math.min(maxIdx, i + 1));
      if (key.return || input === "o") {
        const result = selectedPackage.results[resultIndex];
        if (result) {
          openInBrowser(`${result.repoUrl}/blob/${result.branch}/package.json`);
        }
      }
    }
  });

  // Reset result index when switching packages
  React.useEffect(() => {
    setResultIndex(0);
  }, [packageIndex]);

  const statusBarHeight = 3;
  const mainHeight = height - statusBarHeight;

  // Sidebar width adapts to longest package name (min 20, max 40% of screen)
  const longestName = Math.max(
    "[+] Add package".length,
    ...trackedPackages.map((p) => p.length + 5), // 2 prefix + " ..." suffix
  );
  const sidebarWidth = Math.min(
    Math.max(longestName + 4, 20), // +4 for border + padding
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth;

  if (showHelp) {
    return (
      <Box height={height} width={width}>
        <HelpOverlay height={height} width={width} view="dependencies" />
      </Box>
    );
  }

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <PackageList
          packages={packageList}
          selectedIndex={packageIndex}
          isFocused={focus === "sidebar"}
          width={sidebarWidth}
        />
        <DepResults
          results={selectedResults}
          packageName={selectedPackage?.name ?? ""}
          selectedIndex={resultIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={focus === "list"}
          loading={selectedPackage?.loading ?? false}
          error={selectedPackage?.error ?? null}
        />
      </Box>

      {/* Status bar */}
      <DepStatusBar selectedPackage={selectedPackage} width={width} />

      {/* Package search overlay */}
      {showPackageSearch && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 20) / 2)}
        >
          <PackageSearch
            trackedPackages={trackedPackages}
            onSelect={(pkg) => {
              addPackage(pkg);
            }}
            onClose={() => setShowPackageSearch(false)}
            height={height}
            width={width}
          />
        </Box>
      )}
    </Box>
  );
}
