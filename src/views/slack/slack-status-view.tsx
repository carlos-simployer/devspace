import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Dialog } from "../../ui/dialog.tsx";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useSlackContext } from "./slack-context.ts";

const STATUS_OPTIONS = [
  { text: "In a meeting", emoji: ":calendar:" },
  { text: "Focusing", emoji: ":headphones:" },
  { text: "Out sick", emoji: ":face_with_thermometer:" },
  { text: "On vacation", emoji: ":palm_tree:" },
  { text: "Working remotely", emoji: ":house_with_garden:" },
  { text: "", emoji: "", label: "Clear status" },
];

export function SlackStatusView() {
  const { width } = useAppContext();
  const { navigate } = useRouter();
  const { mutations, showStatus } = useSlackContext();

  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      navigate("slack");
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(STATUS_OPTIONS.length - 1, i + 1));
      return;
    }
    if (key.return) {
      const opt = STATUS_OPTIONS[selectedIndex]!;
      mutations.setStatus.mutate(
        { text: opt.text, emoji: opt.emoji },
        {
          onSuccess: () => {
            showStatus(opt.text ? `Status: ${opt.text}` : "Status cleared");
            navigate("slack");
          },
          onError: (err: any) => {
            showStatus(`Error: ${err.message}`);
            navigate("slack");
          },
        },
      );
      return;
    }
  });

  const boxWidth = Math.min(45, width - 4);
  // Title (1) + border (2) + items (6) + footer (1) + spacing (1)
  const boxHeight = STATUS_OPTIONS.length + 5;

  return (
    <Dialog
      title="Set Status"
      width={boxWidth}
      height={boxHeight}
      footer={
        <Text dimColor>
          {"\u2191\u2193"}: navigate | Enter: apply | Esc: cancel
        </Text>
      }
    >
      {STATUS_OPTIONS.map((opt, i) => {
        const isSelected = i === selectedIndex;
        const label = opt.label ?? `${opt.emoji} ${opt.text}`;
        return (
          <Box key={i}>
            <Text inverse={isSelected} bold={isSelected}>
              {isSelected ? "> " : "  "}
              {label}
            </Text>
          </Box>
        );
      })}
    </Dialog>
  );
}
