import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../ui/theme.ts";

interface ShortcutDef {
  key: string;
  label: string;
}

interface Props {
  items: ShortcutDef[];
}

export function Shortcuts({ items }: Props) {
  return (
    <Box gap={1}>
      {items.map((item) => (
        <Box key={item.key + item.label}>
          <Text bold color={getTheme().ui.shortcutKey}>
            {item.key}
          </Text>
          <Text dimColor> {item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
