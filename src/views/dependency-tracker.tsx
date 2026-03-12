import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type { FocusArea, TrackedPackage } from "../api/types.ts";
import { useDependencySearch } from "../hooks/use-dependency-search.ts";
import { PackageList } from "../components/package-list.tsx";
import { DepResults } from "../components/dep-results.tsx";
import { DepStatusBar } from "../components/dep-status-bar.tsx";
import { PackageSearch } from "../components/package-search.tsx";
import { HelpOverlay } from "../components/help-overlay.tsx";

interface Props {
  token: string;
  org: string;
  trackedPackages: string[];
  addPackage: (pkg: string) => void;
  removePackage: (pkg: string) => void;
  onSwitchView: () => void;
  height: number;
  width: number;
  onQuit: () => void;
}

export function DependencyTracker({
  token,
  org,
  trackedPackages,
  addPackage,
  removePackage,
  onSwitchView,
  height,
  width,
  onQuit,
}: Props) {
  const { packages, refetch } = useDependencySearch(
    token,
    org,
    trackedPackages,
  );

  const [focus, setFocus] = useState<FocusArea>("sidebar");
  const [packageIndex, setPackageIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [showPackageSearch, setShowPackageSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const packageList: TrackedPackage[] = trackedPackages.map(
    (name) =>
      packages.get(name) ?? {
        name,
        results: [],
        loading: false,
        error: null,
        lastRefresh: null,
      },
  );

  const selectedPackage = packageList[packageIndex] ?? null;

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

    if (input === "q") {
      onQuit();
      return;
    }

    if (key.tab) {
      onSwitchView();
      return;
    }

    if (input === "?") {
      setShowHelp(true);
      return;
    }

    if (input === "R") {
      refetch();
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

  const headerHeight = 3;
  const statusBarHeight = 3;
  const mainHeight = height - headerHeight - statusBarHeight;

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
      {/* Header */}
      <Box
        width={width}
        height={headerHeight}
        flexDirection="column"
        paddingX={1}
      >
        <Box>
          <Text bold color="magenta">
            Dependency Tracker
          </Text>
          <Text dimColor> [Tab: switch to PRs]</Text>
        </Box>
        <Text dimColor>+ Add d Remove R Refresh o Open / Enter ? Help</Text>
      </Box>

      {/* Main area */}
      <Box flexGrow={1} height={mainHeight}>
        <PackageList
          packages={packageList}
          selectedIndex={packageIndex}
          isFocused={focus === "sidebar"}
          width={sidebarWidth}
        />
        <DepResults
          results={selectedPackage?.results ?? []}
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
