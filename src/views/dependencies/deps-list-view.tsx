import React from "react";
import { Box } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { useDepsContext } from "./deps-context.ts";
import { PackageList } from "./package-list.tsx";
import { DepResults } from "./dep-results.tsx";
import { DepStatusBar } from "./dep-status-bar.tsx";

export function DepsListView() {
  const {
    depFetchPackage: fetchPackage,
    config,
    removePackage,
    contentHeight: height,
    width,
    onQuit,
  } = useAppContext();
  const trackedPackages = config.trackedPackages;
  const { navigate } = useRouter();
  const {
    focus,
    setFocus,
    packageIndex,
    setPackageIndex,
    resultIndex,
    setResultIndex,
    packageList,
    selectedPackage,
    selectedResults,
  } = useDepsContext();

  const selectedName = selectedPackage?.name ?? null;

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
          if (key.upArrow) setPackageIndex((i: number) => Math.max(0, i - 1));
          if (key.downArrow)
            setPackageIndex((i: number) => Math.min(maxIdx, i + 1));
        }
        if (focus === "list" && selectedPackage) {
          const maxIdx = selectedPackage.results.length - 1;
          if (key.upArrow) setResultIndex((i: number) => Math.max(0, i - 1));
          if (key.downArrow)
            setResultIndex((i: number) => Math.min(maxIdx, i + 1));
        }
      },
    },
  );

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
