import React from "react";
import { Box, Text } from "ink";
import type { AzureReleaseDefinition } from "../../api/types.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  definitions: AzureReleaseDefinition[];
  selectedIndex: number;
  isFocused: boolean;
  width: number;
}

export const DefinitionSidebar = React.memo(function DefinitionSidebar({
  definitions,
  selectedIndex,
  isFocused,
  width,
}: Props) {
  const items = [
    ...definitions.map((d) => ({ label: d.name, isAdd: false, def: d })),
    { label: "[+] Add definition", isAdd: true, def: null },
  ];

  // Inner content width = total width - border (1) - paddingRight (1)
  const innerWidth = width - 2;

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderRight
      borderLeft={false}
      borderTop={false}
      borderBottom={false}
      paddingRight={1}
    >
      <Text bold dimColor={!isFocused}>
        Release Definitions
      </Text>
      {items.map((item, i) => {
        const isActive = isFocused && i === selectedIndex;
        const isSelected = !item.isAdd && i === selectedIndex;
        const prefix = isSelected && !item.isAdd ? "● " : "  ";
        const text = prefix + item.label;
        const truncated =
          text.length > innerWidth ? text.slice(0, innerWidth - 1) + "…" : text;
        const padded = isActive ? truncated.padEnd(innerWidth) : truncated;

        return (
          <Box key={item.label + i}>
            <Text
              inverse={isActive}
              color={
                isActive
                  ? undefined
                  : item.isAdd
                    ? getTheme().list.addAction
                    : isSelected
                      ? "white"
                      : undefined
              }
              bold={isActive || isSelected}
              dimColor={!isFocused && !isSelected && !isActive}
            >
              {padded}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
});
