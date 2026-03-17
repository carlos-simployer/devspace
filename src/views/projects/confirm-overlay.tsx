import React, { useState } from "react";
import { Box, Text } from "ink";
import { Overlay } from "../../ui/overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useProjectsContext } from "./projects-context.ts";
import { getTheme } from "../../ui/theme.ts";

export function ConfirmOverlay() {
  const { navigate } = useRouter();
  const {
    config,
    removeLocalProject,
    contentHeight: height,
    width,
  } = useAppContext();
  const {
    confirmAction,
    setConfirmAction,
    setSelectedIndex,
    startAll,
    stopAll,
  } = useProjectsContext();

  // 0 = No (default), 1 = Yes
  const [cursorIndex, setCursorIndex] = useState(0);

  const theme = getTheme();
  const localProjects = config.localProjects;

  const isDestructive =
    confirmAction?.type.startsWith("kill") ||
    confirmAction?.type === "removeProject";
  const titleColor = isDestructive ? theme.input.warning : theme.status.info;

  const boxWidth = Math.min(55, width - 4);
  const boxHeight = Math.min(height - 4, 10);
  const innerWidth = boxWidth - 4;

  useRouteShortcuts({
    close: () => {
      setConfirmAction(null);
      navigate("projects");
    },
    select: () => {
      if (cursorIndex === 1 && confirmAction) {
        // Yes — execute
        if (confirmAction.type === "startAll" && confirmAction.projectName) {
          startAll(confirmAction.projectName);
        } else if (confirmAction.type === "startAll") {
          for (const p of localProjects) {
            startAll(p.name);
          }
        } else if (
          confirmAction.type === "killProject" &&
          confirmAction.projectName
        ) {
          stopAll(confirmAction.projectName);
        } else if (confirmAction.type === "killAll") {
          for (const p of localProjects) {
            stopAll(p.name);
          }
        } else if (
          confirmAction.type === "removeProject" &&
          confirmAction.projectName
        ) {
          stopAll(confirmAction.projectName);
          removeLocalProject(confirmAction.projectName);
          setSelectedIndex((i) => Math.max(0, i - 1));
        }
      }
      setConfirmAction(null);
      navigate("projects");
    },
    up: () => setCursorIndex((i) => Math.max(0, i - 1)),
    down: () => setCursorIndex((i) => Math.min(1, i + 1)),
  });

  if (!confirmAction) {
    return (
      <Overlay title="Confirm" width={boxWidth} height={boxHeight}>
        <Text dimColor>No action pending</Text>
      </Overlay>
    );
  }

  const options = [
    { label: "No", color: undefined },
    {
      label: "Yes",
      color: isDestructive ? theme.input.warning : theme.status.success,
    },
  ];

  return (
    <Overlay
      title={confirmAction.label}
      titleColor={titleColor}
      width={boxWidth}
      height={boxHeight}
      footer={<Text dimColor>Enter: select | Esc: cancel</Text>}
    >
      {confirmAction.detail && (
        <Box marginBottom={1}>
          <Text dimColor>{confirmAction.detail}</Text>
        </Box>
      )}
      {options.map((opt, i) => {
        const isActive = i === cursorIndex;
        const label = `  ${opt.label}`.padEnd(innerWidth);
        return (
          <Box key={opt.label}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={isActive ? "white" : opt.color}
              bold={isActive}
            >
              {label}
            </Text>
          </Box>
        );
      })}
    </Overlay>
  );
}
