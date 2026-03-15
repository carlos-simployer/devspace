import React, { useState } from "react";
import { Box, Text } from "ink";
import { Overlay } from "../../ui/overlay.tsx";
import { useShortcuts } from "../../hooks/use-shortcuts.ts";
import {
  ALL_SORT_FIELDS,
  SORT_FIELD_LABELS,
  type JiraSortField,
} from "../../utils/jira-status.ts";

interface Props {
  activeSortFields: JiraSortField[];
  onApply: (fields: JiraSortField[]) => void;
  onClose: () => void;
  height: number;
  width: number;
}

export function SortOverlay({
  activeSortFields,
  onApply,
  onClose,
  height,
  width,
}: Props) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [selected, setSelected] = useState<JiraSortField[]>(() => [
    ...activeSortFields,
  ]);

  const boxWidth = Math.min(45, width - 4);
  const boxHeight = Math.min(height - 4, ALL_SORT_FIELDS.length + 6);
  const innerWidth = boxWidth - 4;

  useShortcuts(
    {
      close: onClose,
      select: () => onApply(selected),
      toggle: () => {
        const field = ALL_SORT_FIELDS[cursorIndex];
        if (!field) return;
        setSelected((prev) => {
          const idx = prev.indexOf(field);
          if (idx >= 0) {
            // Remove it
            return prev.filter((f) => f !== field);
          } else {
            // Add it at the end
            return [...prev, field];
          }
        });
      },
      up: () => setCursorIndex((i) => Math.max(0, i - 1)),
      down: () =>
        setCursorIndex((i) => Math.min(ALL_SORT_FIELDS.length - 1, i + 1)),
    },
    { scope: "jira.sort" },
  );

  return (
    <Overlay
      title="Sort Issues (within status groups)"
      width={boxWidth}
      height={boxHeight}
      footer={<Text dimColor>Space: toggle | Enter: apply | Esc: cancel</Text>}
    >
      {ALL_SORT_FIELDS.map((field, i) => {
        const isActive = i === cursorIndex;
        const sortIdx = selected.indexOf(field);
        const isSelected = sortIdx >= 0;
        const prefix = isSelected ? `[${sortIdx + 1}]` : "[ ]";
        const label = `${prefix} ${SORT_FIELD_LABELS[field]}`.padEnd(
          innerWidth,
        );

        return (
          <Box key={field}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={isActive ? "white" : isSelected ? "cyan" : undefined}
              bold={isSelected}
            >
              {label}
            </Text>
          </Box>
        );
      })}
    </Overlay>
  );
}
