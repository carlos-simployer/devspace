import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Dialog } from "./dialog.tsx";

export interface ConfirmOption {
  label: string;
  value: string;
  color?: string;
}

export interface ConfirmDialogProps {
  title: string;
  message: string;
  detail?: string;
  options?: ConfirmOption[];
  onSelect: (value: string) => void;
  onCancel: () => void;
  width?: number;
}

const DEFAULT_OPTIONS: ConfirmOption[] = [
  { label: "No", value: "no" },
  { label: "Yes", value: "yes", color: "green" },
];

export function ConfirmDialog({
  title,
  message,
  detail,
  options = DEFAULT_OPTIONS,
  onSelect,
  onCancel,
  width = 50,
}: ConfirmDialogProps) {
  const [cursorIndex, setCursorIndex] = useState(0);

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.upArrow) {
      setCursorIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setCursorIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (key.return) {
      onSelect(options[cursorIndex].value);
      return;
    }
  });

  const innerWidth = width - 4;

  return (
    <Dialog
      title={title}
      width={width}
      footer={
        <Text dimColor>{"↑↓: navigate │ Enter: select │ Esc: cancel"}</Text>
      }
    >
      <Box marginBottom={1}>
        <Text>{message}</Text>
      </Box>

      {detail && (
        <Box marginBottom={1}>
          <Text dimColor>{detail}</Text>
        </Box>
      )}

      {options.map((opt, i) => {
        const isActive = i === cursorIndex;
        const label = `  ${opt.label}`.padEnd(innerWidth);
        return (
          <Box key={opt.value}>
            <Text
              inverse={isActive}
              bold={isActive}
              color={!isActive ? opt.color : undefined}
            >
              {label}
            </Text>
          </Box>
        );
      })}
    </Dialog>
  );
}
