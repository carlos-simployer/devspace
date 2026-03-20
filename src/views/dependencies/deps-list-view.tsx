import React from "react";
import { Box, Text } from "ink";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useFocusNode } from "../../ui/focus.ts";
import { Panel } from "../../ui/panel.tsx";
import { getTheme } from "../../ui/theme.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { useDepsContext } from "./deps-context.ts";
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
  const { navigate, route } = useRouter();
  const {
    packageIndex,
    setPackageIndex,
    resultIndex,
    setResultIndex,
    packageList,
    selectedPackage,
    selectedResults,
  } = useDepsContext();

  const selectedName = selectedPackage?.name ?? null;

  // ── Focus nodes ─────────────────────────────────────────────────────
  const { isFocused: sidebarFocused } = useFocusNode({
    id: "sidebar",
    order: 0,
  });
  const { isFocused: listFocused } = useFocusNode({
    id: "list",
    order: 1,
  });

  const isMainView = route === "dependencies";

  useRouteShortcuts(
    {
      quit: onQuit,
      refresh: () => {
        if (selectedName) fetchPackage(selectedName, true);
      },
      add: () => navigate("dependencies/search"),
    },
    {
      active: isMainView,
      focusHandlers: {
        sidebar: {
          up: () => setPackageIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = trackedPackages.length; // +1 for "[+] Add"
            setPackageIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            if (packageIndex === trackedPackages.length) {
              navigate("dependencies/search");
            }
          },
          open: () => {
            if (packageIndex === trackedPackages.length) {
              navigate("dependencies/search");
            }
          },
          remove: () => {
            if (packageIndex < trackedPackages.length) {
              const pkg = trackedPackages[packageIndex];
              if (pkg) {
                removePackage(pkg);
                setPackageIndex((i) => Math.max(0, i - 1));
              }
            }
          },
        },
        list: {
          up: () => setResultIndex((i) => Math.max(0, i - 1)),
          down: () => {
            const maxIdx = (selectedPackage?.results.length ?? 1) - 1;
            setResultIndex((i) => Math.min(maxIdx, i + 1));
          },
          select: () => {
            if (selectedPackage) {
              const result = selectedPackage.results[resultIndex];
              if (result) {
                openInBrowser(
                  `${result.repoUrl}/blob/${result.branch}/package.json`,
                );
              }
            }
          },
          open: () => {
            if (selectedPackage) {
              const result = selectedPackage.results[resultIndex];
              if (result) {
                openInBrowser(
                  `${result.repoUrl}/blob/${result.branch}/package.json`,
                );
              }
            }
          },
        },
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
  const gap = 1;
  const sidebarWidth = Math.min(
    Math.max(longestName + 4, 20), // +4 for border + padding
    Math.floor(width * 0.4),
  );
  const listWidth = width - sidebarWidth - gap;

  // Build sidebar items
  const sidebarItems = [
    ...packageList.map((p) => ({
      label: p.name,
      isAdd: false,
      pkg: p,
    })),
    { label: "[+] Add package", isAdd: true, pkg: null },
  ];
  const sidebarInnerWidth = sidebarWidth - 2; // borders only, no padding

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area */}
      <Box flexGrow={1} height={mainHeight} gap={gap}>
        <Panel
          title="Packages"
          focused={sidebarFocused}
          width={sidebarWidth}
          height={mainHeight}
          paddingX={0}
        >
          {sidebarItems.map((item, i) => {
            const isActive = sidebarFocused && i === packageIndex;
            const isSelected = !item.isAdd && i === packageIndex;
            const prefix = isSelected && !item.isAdd ? "\u25CF " : "  ";
            const suffix = item.pkg?.loading ? " ..." : "";
            const text = prefix + item.label + suffix;
            const padded = isActive ? text.padEnd(sidebarInnerWidth) : text;

            return (
              <Box key={item.label + i}>
                <Text
                  inverse={isActive}
                  color={
                    isActive
                      ? undefined
                      : item.isAdd
                        ? getTheme().list.addAction
                        : isSelected
                          ? "white"
                          : undefined
                  }
                  bold={isActive || isSelected}
                  dimColor={!sidebarFocused && !isSelected && !isActive}
                >
                  {padded}
                </Text>
              </Box>
            );
          })}
        </Panel>
        <DepResults
          results={selectedResults}
          packageName={selectedPackage?.name ?? ""}
          selectedIndex={resultIndex}
          height={mainHeight}
          width={listWidth}
          isFocused={listFocused}
          loading={selectedPackage?.loading ?? false}
          error={selectedPackage?.error ?? null}
        />
      </Box>

      {/* Status bar */}
      <DepStatusBar selectedPackage={selectedPackage} width={width} />
    </Box>
  );
}
