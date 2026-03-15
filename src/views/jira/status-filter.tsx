import React, { useState } from "react";
import { Box, Text } from "ink";
import { Overlay } from "../../ui/overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { getStatusColor } from "../../utils/jira-status.ts";

interface Props {
  statuses: string[];
  enabledStatuses: Set<string>;
  onApply: (enabled: Set<string>) => void;
  onClose: () => void;
  height: number;
  width: number;
}

export function StatusFilter({
  statuses,
  enabledStatuses,
  onApply,
  onClose,
  height,
  width,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
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
    close: onClose,
    select: () => {
      onApply(enabled);
    },
    toggle: () => {
      const item = items[selectedIndex];
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
    up: () => setSelectedIndex((i) => Math.max(0, i - 1)),
    down: () => setSelectedIndex((i) => Math.min(items.length - 1, i + 1)),
  });

  const boxWidth = Math.min(40, width - 4);
  const boxHeight = Math.min(height - 4, items.length + 5);
  const innerWidth = boxWidth - 4;

  return (
    <Overlay
      title="Filter by Status"
      width={boxWidth}
      height={boxHeight}
      footer={<Text dimColor>Space: toggle | Enter: apply | Esc: cancel</Text>}
    >
      {items.map((item, i) => {
        const isActive = i === selectedIndex;
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
    </Overlay>
  );
}
