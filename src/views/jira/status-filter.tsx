import React, { useState } from "react";
import { Box, Text } from "ink";
import { Dialog } from "../../ui/dialog.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useJiraContext } from "./jira-context.ts";
import { getStatusColor } from "../../utils/jira-status.ts";

export function StatusFilter() {
  const { navigate } = useRouter();
  const { contentHeight: height, width } = useAppContext();
  const { enabledStatuses, setEnabledStatuses, statusOrder, setSelectedIndex } =
    useJiraContext();

  const statuses = statusOrder;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(enabledStatuses),
  );

  // Items: "All" toggle + each status
  const allEnabled = enabled.size === statuses.length;
  const items = [
    { label: allEnabled ? "Deselect All" : "Select All", isAll: true },
    ...statuses.map((s) => ({ label: s, isAll: false })),
  ];

  useRouteShortcuts({
    close: () => navigate("jira"),
    select: () => {
      setEnabledStatuses(enabled);
      setSelectedIndex(0);
      navigate("jira");
    },
    toggle: () => {
      const item = items[selectedIdx];
      if (!item) return;
      if (item.isAll) {
        if (allEnabled) {
          setEnabled(new Set());
        } else {
          setEnabled(new Set(statuses));
        }
      } else {
        setEnabled((prev) => {
          const next = new Set(prev);
          if (next.has(item.label)) {
            next.delete(item.label);
          } else {
            next.add(item.label);
          }
          return next;
        });
      }
    },
    up: () => setSelectedIdx((i) => Math.max(0, i - 1)),
    down: () => setSelectedIdx((i) => Math.min(items.length - 1, i + 1)),
  });

  const boxWidth = Math.min(40, width - 4);
  const boxHeight = Math.min(height - 4, items.length + 5);
  const innerWidth = boxWidth - 4;

  return (
    <Dialog
      title="Filter by Status"
      width={boxWidth}
      height={boxHeight}
      footer={<Text dimColor>Space: toggle | Enter: apply | Esc: cancel</Text>}
    >
      {items.map((item, i) => {
        const isActive = i === selectedIdx;
        const isEnabled = item.isAll ? allEnabled : enabled.has(item.label);
        const checkbox = isEnabled ? "[x]" : "[ ]";
        const statusColor = item.isAll
          ? undefined
          : getStatusColor(
              // We don't have the category here, so use a simple mapping
              item.label.toLowerCase().includes("done")
                ? "done"
                : item.label.toLowerCase().includes("to do")
                  ? "new"
                  : "indeterminate",
            );
        const label = `${checkbox} ${item.label}`.padEnd(innerWidth);

        return (
          <Box key={item.label}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={isActive ? "white" : statusColor}
              bold={item.isAll}
            >
              {label}
            </Text>
          </Box>
        );
      })}
    </Dialog>
  );
}
