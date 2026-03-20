import React from "react";
import { Text } from "ink";
import { ConfirmDialog } from "../ui/confirm-dialog.tsx";
import { getTheme } from "../ui/theme.ts";
import { APP_NAME } from "../constants.ts";

interface Props {
  hasRunningProcesses: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QuitConfirm({
  hasRunningProcesses,
  onConfirm,
  onCancel,
}: Props) {
  const theme = getTheme();

  return (
    <ConfirmDialog
      title={`Quit ${APP_NAME}?`}
      message=""
      detail={
        hasRunningProcesses
          ? "Running processes in Projects will be terminated."
          : undefined
      }
      options={[
        { label: "Yes, quit", value: "yes", color: theme.status.failure },
        { label: "No, cancel", value: "no" },
      ]}
      onSelect={(value) => {
        if (value === "yes") onConfirm();
        else onCancel();
      }}
      onCancel={onCancel}
      width={45}
    />
  );
}
