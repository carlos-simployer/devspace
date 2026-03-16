import React, { useState } from "react";
import { Box, Text } from "ink";
import { Overlay } from "../../ui/overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { usePrsContext } from "./prs-context.ts";
import { ADD_PR_REVIEW } from "../../api/mutations.ts";
import { getTheme } from "../../ui/theme.ts";

export function ApproveOverlay() {
  const { navigate } = useRouter();
  const { contentHeight: height, width } = useAppContext();
  const { selectedPR, client, refetch, showStatus } = usePrsContext();

  // 0 = Approve, 1 = Cancel (default)
  const [cursorIndex, setCursorIndex] = useState(1);
  const [applying, setApplying] = useState(false);

  const theme = getTheme();
  const boxWidth = Math.min(50, width - 4);
  const boxHeight = Math.min(height - 4, 10);
  const innerWidth = boxWidth - 4;

  useRouteShortcuts({
    close: () => navigate("prs"),
    select: () => {
      if (applying) return;
      if (cursorIndex === 1) {
        navigate("prs");
        return;
      }
      if (!selectedPR) return;

      setApplying(true);
      (async () => {
        try {
          await client(ADD_PR_REVIEW, {
            pullRequestId: selectedPR.id,
            event: "APPROVE",
          });
          showStatus(`Approved PR #${selectedPR.number}`);
          refetch();
          navigate("prs");
        } catch (err: any) {
          showStatus(`Error: ${err.message}`);
          navigate("prs");
        }
      })();
    },
    up: () => setCursorIndex((i) => Math.max(0, i - 1)),
    down: () => setCursorIndex((i) => Math.min(1, i + 1)),
  });

  if (!selectedPR) {
    return (
      <Overlay title="Approve PR" width={boxWidth} height={boxHeight}>
        <Text dimColor>No PR selected</Text>
      </Overlay>
    );
  }

  const options = [
    { label: "Approve", color: theme.status.success },
    { label: "Cancel", color: undefined },
  ];

  return (
    <Overlay
      title="Approve PR"
      width={boxWidth}
      height={boxHeight}
      footer={
        <Text dimColor>
          {applying ? "Approving..." : "Enter: select | Esc: cancel"}
        </Text>
      }
    >
      <Box marginBottom={1} flexDirection="column">
        <Text>
          <Text bold>#{selectedPR.number}</Text>{" "}
          <Text>{selectedPR.title.slice(0, innerWidth - 8)}</Text>
        </Text>
        <Text dimColor>{selectedPR.repository.name}</Text>
      </Box>
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
