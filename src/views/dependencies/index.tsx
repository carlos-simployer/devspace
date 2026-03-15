import React, { useState, useMemo } from "react";
import { Box } from "ink";
import type { FocusArea, TrackedPackage } from "../../api/types.ts";
import { compareDependencyByVersion } from "../../api/dependency-queries.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { PackageList } from "./package-list.tsx";
import { DepResults } from "./dep-results.tsx";
import { DepStatusBar } from "./dep-status-bar.tsx";
import { PackageSearch } from "./package-search.tsx";
import { HelpOverlay } from "../../components/help-overlay.tsx";

export function DependencyTracker() {
  const {
    depPackages: packages,
    depFetchPackage: fetchPackage,
    config,
    addPackage,
    removePackage,
    contentHeight: height,
    width,
    onQuit,
  } = useAppContext();
  const trackedPackages = config.trackedPackages;
  const { route, navigate } = useRouter();
  const showHelp = route === "dependencies/help";
  const showPackageSearch = route === "dependencies/search";

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

  useRouteShortcuts(
    {
      quit: onQuit,
      refresh: () => {
        if (selectedName) fetchPackage(selectedName, true);
      },
      add: () => navigate("dependencies/search"),
      remove: () => {
        if (focus === "sidebar" && packageIndex < trackedPackages.length) {
          const pkg = trackedPackages[packageIndex];
          if (pkg) {
            removePackage(pkg);
            setPackageIndex((i) => Math.max(0, i - 1));
          }
        }
      },
      open: () => {
        if (focus === "sidebar") {
          if (packageIndex === trackedPackages.length) {
            navigate("dependencies/search");
          }
        } else if (focus === "list" && selectedPackage) {
          const result = selectedPackage.results[resultIndex];
          if (result) {
            openInBrowser(
              `${result.repoUrl}/blob/${result.branch}/package.json`,
            );
          }
        }
      },
      select: () => {
        if (focus === "sidebar") {
          if (packageIndex === trackedPackages.length) {
            navigate("dependencies/search");
          }
        } else if (focus === "list" && selectedPackage) {
          const result = selectedPackage.results[resultIndex];
          if (result) {
            openInBrowser(
              `${result.repoUrl}/blob/${result.branch}/package.json`,
            );
          }
        }
      },
      left: () => setFocus("sidebar"),
      right: () => setFocus("list"),
    },
    {
      onUnhandled: (_input, key) => {
        // Navigation depends on focus area
        if (focus === "sidebar") {
          const maxIdx = trackedPackages.length; // +1 for "[+] Add"
          if (key.upArrow) setPackageIndex((i) => Math.max(0, i - 1));
          if (key.downArrow) setPackageIndex((i) => Math.min(maxIdx, i + 1));
        }
        if (focus === "list" && selectedPackage) {
          const maxIdx = selectedPackage.results.length - 1;
          if (key.upArrow) setResultIndex((i) => Math.max(0, i - 1));
          if (key.downArrow) setResultIndex((i) => Math.min(maxIdx, i + 1));
        }
      },
    },
  );

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
        <HelpOverlay height={height} width={width} route="dependencies" />
      </Box>
    );
  }

  if (showPackageSearch) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <PackageSearch
          trackedPackages={trackedPackages}
          onSelect={(pkg) => {
            addPackage(pkg);
          }}
          onClose={() => navigate("dependencies")}
          height={height}
          width={width}
        />
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
    </Box>
  );
}
