import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { exec } from "child_process";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { processKey } from "../../hooks/use-local-processes.ts";
import { getTheme } from "../../ui/index.ts";
import { useProjectsContext } from "./projects-context.ts";
import { ProjectSidebar } from "./project-sidebar.tsx";
import { CommandPanel } from "./command-panel.tsx";
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
    selectedCommandIndex,
    setSelectedCommandIndex,
    focus,
    setFocus,
    states,
    startCommand,
    startAll,
    stopOne,
    stopAll,
    restartCommand,
    clearLogs,
    getProjectStatus,
    getDependents,
    setConfirmAction,
  } = useProjectsContext();

  const [logScroll, setLogScroll] = useState<number | null>(null);
  const [uptimeTick, setUptimeTick] = useState(0);

  const showAdd = route === "projects/add";

  const theme = getTheme();
  const selected = localProjects[selectedIndex];
  const selectedName = selected?.name ?? "";
  const selectedCmd = selected?.commands[selectedCommandIndex];
  const selectedCmdKey =
    selected && selectedCmd ? processKey(selected.name, selectedCmd.name) : "";
  const selectedCmdState = selectedCmdKey ? states[selectedCmdKey] : undefined;

  // Tick every 10s to update uptime display
  useEffect(() => {
    const timer = setInterval(() => setUptimeTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Reset command index when project changes
  useEffect(() => {
    setSelectedCommandIndex(0);
    setLogScroll(null);
  }, [selectedIndex, setSelectedCommandIndex]);

  // Log scroll helper
  const currentOffset = () => {
    const logs = selectedCmdState?.logs ?? [];
    return logScroll ?? Math.max(0, logs.length - (height - 8));
  };

  useRouteShortcuts(
    {
      quit: () => onQuit(),

      // Focus switching
      left: () => setFocus("sidebar"),
      right: () => {
        if (selected && selected.commands.length > 0) {
          setFocus("commands");
        }
      },

      // Navigation
      up: () => {
        if (focus === "sidebar") {
          setSelectedIndex((i) => Math.max(0, i - 1));
          setLogScroll(null);
        } else {
          setSelectedCommandIndex((i) => Math.max(0, i - 1));
          setLogScroll(null);
        }
      },
      down: () => {
        if (focus === "sidebar") {
          // Allow selecting [+] Add at the end
          setSelectedIndex((i) => Math.min(localProjects.length, i + 1));
          setLogScroll(null);
        } else if (selected) {
          setSelectedCommandIndex((i) =>
            Math.min(selected.commands.length - 1, i + 1),
          );
          setLogScroll(null);
        }
      },

      // Log scrolling
      scrollUp: () => setLogScroll(Math.max(0, currentOffset() - 1)),
      scrollDown: () => setLogScroll(currentOffset() + 1),
      pageUp: () => setLogScroll(Math.max(0, currentOffset() - 10)),
      pageDown: () => setLogScroll(currentOffset() + 10),
      logTop: () => setLogScroll(0),
      logBottom: () => setLogScroll(null),
      clearLogs: () => {
        if (selected && selectedCmd) {
          clearLogs(selectedName, selectedCmd.name);
          setLogScroll(null);
        }
      },

      // Command actions
      start: () => {
        if (focus === "commands" && selected && selectedCmd) {
          const key = processKey(selected.name, selectedCmd.name);
          if (states[key]?.status !== "running") {
            startCommand(selected.name, selectedCmd.name);
          }
        } else if (focus === "sidebar" && selected) {
          if (selected.commands.length > 1) {
            setConfirmAction({
              type: "startAll",
              projectName: selected.name,
              label: `Start all commands for ${selected.name}?`,
              detail: selected.commands.map((c) => c.name).join(", "),
            });
            navigate("projects/confirm");
          } else {
            startAll(selected.name);
          }
        }
      },
      kill: () => {
        if (!selected) return;
        if (focus === "commands" && selectedCmd) {
          const key = processKey(selected.name, selectedCmd.name);
          const st = states[key];
          if (st?.status === "running" || st?.status === "starting") {
            stopOne(selected.name, selectedCmd.name);
          }
        } else if (focus === "sidebar") {
          const status = getProjectStatus(selected.name);
          if (status !== "running" && status !== "starting") return;
          const dependents = getDependents(selected.name).filter(
            (d) => getProjectStatus(d) === "running",
          );
          setConfirmAction({
            type: "killProject",
            projectName: selected.name,
            label: `Kill all commands for ${selected.name}?`,
            detail:
              dependents.length > 0
                ? `Running dependents: ${dependents.join(", ")}`
                : undefined,
          });
          navigate("projects/confirm");
        }
      },
      restart: () => {
        if (focus === "commands" && selected && selectedCmd) {
          restartCommand(selected.name, selectedCmd.name);
        } else if (focus === "sidebar" && selected) {
          stopAll(selected.name);
          setTimeout(() => startAll(selected.name), 500);
        }
      },
      open: () => {
        const cmdUrl = selectedCmd?.url;
        if (cmdUrl) {
          try {
            exec(`open "${cmdUrl}"`);
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
      openTerminal: () => {
        if (selected) {
          try {
            exec(
              `osascript -e 'tell application "iTerm2"' -e 'tell current window' -e 'create tab with default profile' -e 'tell current session' -e 'write text "cd ${selected.path.replace(/"/g, '\\"')}"' -e 'end tell' -e 'end tell' -e 'end tell'`,
            );
          } catch {
            // ignore
          }
        }
      },
      select: () => {
        if (focus === "sidebar" && selectedIndex === localProjects.length) {
          navigate("projects/add");
        }
      },
      add: () => navigate("projects/add"),
      remove: () => {
        if (selected) {
          setConfirmAction({
            type: "removeProject",
            projectName: selected.name,
            label: `Remove project "${selected.name}"?`,
            detail:
              "This will stop all commands and remove the project from config.",
          });
          navigate("projects/confirm");
        }
      },
      startAll: () => {
        if (localProjects.length > 0) {
          setConfirmAction({
            type: "startAll",
            label: "Start all projects?",
            detail: localProjects.map((p) => p.name).join(", "),
          });
          navigate("projects/confirm");
        }
      },
    },
    {},
  );

  // Use uptimeTick to avoid lint warning
  void uptimeTick;

  const runningCount = Object.values(states).filter(
    (s) => s.status === "running",
  ).length;

  // Layout: sidebar on left, command panel on right
  const sidebarWidth = Math.min(
    Math.max(
      ...localProjects.map((p) => p.name.length + 5),
      "[+] Add project".length + 2,
      16,
    ),
    Math.floor(width * 0.3),
  );
  const mainWidth = width - sidebarWidth;
  const statusBarHeight = 2;
  const mainContentHeight = height - statusBarHeight;

  // Handle sidebar-only selection of [+] Add
  const isSidebarAddSelected =
    focus === "sidebar" && selectedIndex === localProjects.length;

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Main area: sidebar + command panel */}
      <Box flexGrow={1} height={mainContentHeight}>
        <ProjectSidebar
          projects={localProjects}
          selectedIndex={selectedIndex}
          isFocused={focus === "sidebar"}
          height={mainContentHeight}
          width={sidebarWidth}
          getProjectStatus={getProjectStatus}
        />
        {selected && !isSidebarAddSelected ? (
          <CommandPanel
            project={selected}
            states={states}
            selectedCommandIndex={selectedCommandIndex}
            isFocused={focus === "commands"}
            height={mainContentHeight}
            width={mainWidth}
            logScrollOffset={logScroll}
          />
        ) : (
          <Box
            width={mainWidth}
            height={mainContentHeight}
            alignItems="center"
            justifyContent="center"
          >
            <Text dimColor>
              {localProjects.length === 0
                ? "No projects configured. Press + to add one."
                : "Select a project"}
            </Text>
          </Box>
        )}
      </Box>

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
                {selectedCmd?.url && (
                  <Text color={theme.status.info}> {selectedCmd.url}</Text>
                )}
              </>
            )}
          </Text>
          <Box flexGrow={1} />
          <Text dimColor>
            {"\u2190\u2192"} focus {"\u2502"} {"[ ]"} scroll logs
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
    </Box>
  );
}
