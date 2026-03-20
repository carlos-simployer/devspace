import React from "react";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useProjectsContext } from "./projects-context.ts";
import { getTheme } from "../../ui/theme.ts";

export function ConfirmOverlay() {
  const { navigate } = useRouter();
  const { config, removeLocalProject } = useAppContext();
  const {
    confirmAction,
    setConfirmAction,
    setSelectedIndex,
    startAll,
    stopAll,
  } = useProjectsContext();

  const theme = getTheme();
  const localProjects = config.localProjects;

  // Activate global shortcuts (quit, help, logs, tab switch)
  useRouteShortcuts({});

  const isDestructive =
    confirmAction?.type.startsWith("kill") ||
    confirmAction?.type === "removeProject";

  if (!confirmAction) {
    return (
      <ConfirmDialog
        title="Confirm"
        message="No action pending"
        onSelect={() => {
          navigate("projects");
        }}
        onCancel={() => {
          navigate("projects");
        }}
      />
    );
  }

  const options = [
    { label: "No", value: "no" },
    {
      label: "Yes",
      value: "yes",
      color: isDestructive ? theme.input.warning : theme.status.success,
    },
  ];

  return (
    <ConfirmDialog
      title={confirmAction.label}
      message=""
      detail={confirmAction.detail}
      options={options}
      onSelect={(value) => {
        if (value === "yes" && confirmAction) {
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
      }}
      onCancel={() => {
        setConfirmAction(null);
        navigate("projects");
      }}
    />
  );
}
