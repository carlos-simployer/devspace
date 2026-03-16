import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { exec } from "child_process";
import type { ProcessState } from "../../hooks/use-local-processes.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { getTheme } from "../../ui/index.ts";
import { useProjectsContext } from "./projects-context.ts";
import { ProjectList } from "./project-list.tsx";
import { LogPanel } from "./log-panel.tsx";
import { AddProjectOverlay } from "./add-project.tsx";

export function ProjectsListView() {
  const {
    config,
    addLocalProject,
    removeLocalProject,
    contentHeight: height,
    width,
    onQuit,
  } = useAppContext();
  const localProjects = config.localProjects;
  const { route, navigate } = useRouter();
  const {
    selectedIndex,
    setSelectedIndex,
    states,
    start,
    stop,
    restart,
    clearLogs,
    getDependents,
  } = useProjectsContext();

  const [logScroll, setLogScroll] = useState<number | null>(null); // null = auto-follow
  const [confirmKill, setConfirmKill] = useState<string | null>(null);
  const [uptimeTick, setUptimeTick] = useState(0);

  const showAdd = route === "projects/add";

  const theme = getTheme();
  const selected = localProjects[selectedIndex];
  const selectedName = selected?.name ?? "";
  const selectedState: ProcessState = selected
    ? (states[selected.name] ?? { status: "stopped", logs: [] })
    : { status: "stopped", logs: [] };

  // Tick every 10s to update uptime display
  useEffect(() => {
    const timer = setInterval(() => setUptimeTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll logs when new output arrives (if focused on logs)
  const logState: ProcessState = selected
    ? (states[selected.name] ?? { status: "stopped", logs: [] })
    : { status: "stopped", logs: [] };

  // Log scroll helper
  const currentOffset = () =>
    logScroll ?? Math.max(0, logState.logs.length - (height - 4));

  useRouteShortcuts(
    {
      quit: () => onQuit(),

      // Project list navigation
      up: () => {
        setSelectedIndex((i) => Math.max(0, i - 1));
        setLogScroll(null);
      },
      down: () => {
        setSelectedIndex((i) => Math.min(localProjects.length - 1, i + 1));
        setLogScroll(null);
      },

      // Log scrolling
      scrollUp: () => setLogScroll(Math.max(0, currentOffset() - 1)),
      scrollDown: () => setLogScroll(currentOffset() + 1),
      pageUp: () => setLogScroll(Math.max(0, currentOffset() - 10)),
      pageDown: () => setLogScroll(currentOffset() + 10),
      logTop: () => setLogScroll(0),
      logBottom: () => setLogScroll(null),
      clearLogs: () => {
        if (selected) {
          clearLogs(selectedName);
          setLogScroll(null);
        }
      },

      // Project actions
      start: () => {
        if (selected && selectedState.status !== "running") {
          start(selected.name);
        }
      },
      kill: () => {
        if (!selected) return;
        if (
          selectedState.status !== "running" &&
          selectedState.status !== "starting"
        )
          return;
        const dependents = getDependents(selected.name).filter(
          (d) => states[d]?.status === "running",
        );
        if (dependents.length > 0) {
          setConfirmKill(selected.name);
        } else {
          stop(selected.name);
        }
      },
      restart: () => {
        if (selected) restart(selected.name);
      },
      open: () => {
        if (selected?.url) {
          try {
            exec(`open "${selected.url}"`);
          } catch {
            // ignore
          }
        }
      },
      openInVscode: () => {
        if (selected) {
          try {
            exec(`code "${selected.path}"`);
          } catch {
            // ignore
          }
        }
      },
      openClaude: () => {
        if (selected) {
          try {
            exec(
              `osascript -e 'tell application "iTerm2"' -e 'tell current window' -e 'create tab with default profile' -e 'tell current session' -e 'write text "cd ${selected.path.replace(/"/g, '\\"')} && claude"' -e 'end tell' -e 'end tell' -e 'end tell'`,
            );
          } catch {
            // ignore
          }
        }
      },
      add: () => navigate("projects/add"),
      remove: () => {
        if (selected) {
          if (selectedState.status === "running") {
            stop(selected.name);
          }
          removeLocalProject(selected.name);
          setSelectedIndex((i) => Math.max(0, i - 1));
        }
      },
      startAll: () => {
        for (const p of localProjects) {
          if (states[p.name]?.status !== "running") {
            start(p.name);
          }
        }
      },
    },
    {
      onUnhandled: (input, _key) => {
        // Handle confirmKill dialog -- captures all input
        if (confirmKill) {
          if (input === "y" || input === "Y") {
            stop(confirmKill);
          }
          setConfirmKill(null);
        }
      },
    },
  );

  const runningCount = Object.values(states).filter(
    (s) => s.status === "running",
  ).length;

  // Layout: project list on top, logs below, status bar at bottom
  const statusBarHeight = 2;
  const listHeight = Math.min(localProjects.length + 1, 8); // compact, max 8 rows
  const logPanelHeight = height - listHeight - statusBarHeight;

  // Use uptimeTick to avoid lint warning (it triggers re-renders)
  void uptimeTick;

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Project table (top) */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderBottom
        paddingX={0}
      >
        <ProjectList
          projects={localProjects}
          states={states}
          selectedIndex={selectedIndex}
          width={width}
        />
      </Box>

      {/* Log panel (bottom) */}
      {selected && logPanelHeight > 2 && (
        <LogPanel
          projectName={selectedName}
          state={logState}
          height={logPanelHeight}
          width={width}
          scrollOffset={logScroll}
        />
      )}

      {/* Spacer if no logs */}
      {(!selected || logPanelHeight <= 2) && <Box flexGrow={1} />}

      {/* Status bar */}
      <Box
        width={width}
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
      >
        <Box>
          <Text>
            <Text dimColor>Projects: </Text>
            <Text bold>{localProjects.length}</Text>
            <Text dimColor> {"\u2502"} Running: </Text>
            <Text
              bold
              color={runningCount > 0 ? theme.status.success : undefined}
            >
              {runningCount}
            </Text>
            {selected && (
              <>
                <Text dimColor> {"\u2502"} </Text>
                <Text bold>{selected.name}</Text>
                <Text dimColor>: {selected.path}</Text>
                {selected.url && (
                  <Text color={theme.status.info}> {selected.url}</Text>
                )}
              </>
            )}
          </Text>
          <Box flexGrow={1} />
          <Text dimColor>
            {"[ ]"} scroll logs {"\u2502"} g/G top/bottom
          </Text>
        </Box>
      </Box>

      {/* Add project overlay */}
      {showAdd && (
        <AddProjectOverlay
          existingNames={localProjects.map((p) => p.name)}
          onSubmit={(project) => {
            addLocalProject(project);
            navigate("projects");
          }}
          onCancel={() => navigate("projects")}
          width={width}
          height={height}
        />
      )}

      {/* Confirm kill overlay */}
      {confirmKill && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 6) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={theme.input.warning}
            paddingX={1}
          >
            <Text bold color={theme.input.warning}>
              Kill {confirmKill}?
            </Text>
            <Text>
              Running dependents:{" "}
              {getDependents(confirmKill)
                .filter((dd) => states[dd]?.status === "running")
                .join(", ")}
            </Text>
            <Text dimColor>y: kill anyway {"\u2502"} any key: cancel</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
