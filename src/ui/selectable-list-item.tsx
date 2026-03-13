import React from "react";
import { Box, Text } from "ink";

interface Props {
  isSelected: boolean;
  children: React.ReactNode;
  width?: number;
}

export function SelectableListItem({ isSelected, children }: Props) {
  return (
    <Box>
      <Text
        backgroundColor={isSelected ? "blue" : undefined}
        color={isSelected ? "white" : undefined}
      >
        {isSelected ? "> " : "  "}
        {children}
      </Text>
    </Box>
  );
}
