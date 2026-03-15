import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Overlay } from "../ui/overlay.tsx";
import { getTheme } from "../ui/theme.ts";

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
  const [selected, setSelected] = useState(0); // 0 = Yes, 1 = No
  const theme = getTheme();

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.upArrow) {
      setSelected(0);
      return;
    }
    if (key.downArrow) {
      setSelected(1);
      return;
    }
    if (key.return) {
      if (selected === 0) onConfirm();
      else onCancel();
    }
  });

  return (
    <Overlay title="Quit devspace?" titleColor={theme.input.warning} width={45}>
      {hasRunningProcesses && (
        <Text color={theme.input.warning}>
          Running processes in Projects will be terminated.
        </Text>
      )}
      <Box height={1} />
      <Box flexDirection="column">
        <Box>
          <Text
            inverse={selected === 0}
            bold={selected === 0}
            color={selected === 0 ? undefined : theme.status.failure}
          >
            {selected === 0 ? " > " : "   "}
            Yes, quit
          </Text>
        </Box>
        <Box>
          <Text inverse={selected === 1} bold={selected === 1}>
            {selected === 1 ? " > " : "   "}
            No, cancel
          </Text>
        </Box>
      </Box>
      <Box height={1} />
      <Text dimColor>Enter: confirm | Esc: cancel</Text>
    </Overlay>
  );
}
