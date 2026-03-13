import React from "react";
import { Box, Text } from "ink";

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
          <Text bold color="cyan">
            {item.key}
          </Text>
          <Text dimColor> {item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
