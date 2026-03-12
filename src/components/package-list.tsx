import React from "react";
import { Box, Text } from "ink";
import type { TrackedPackage } from "../api/types.ts";

interface Props {
  packages: TrackedPackage[];
  selectedIndex: number;
  isFocused: boolean;
  width: number;
}

export const PackageList = React.memo(function PackageList({
  packages,
  selectedIndex,
  isFocused,
  width,
}: Props) {
  const items = [
    ...packages.map((p) => ({ label: p.name, isAdd: false, pkg: p })),
    { label: "[+] Add package", isAdd: true, pkg: null },
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
        Packages
      </Text>
      {items.map((item, i) => {
        const isActive = isFocused && i === selectedIndex;
        const isSelected = !item.isAdd && i === selectedIndex;
        const prefix = isSelected && !item.isAdd ? "● " : "  ";
        const suffix = item.pkg?.loading ? " ..." : "";
        const text = prefix + item.label + suffix;
        const padded = isActive ? text.padEnd(innerWidth) : text;

        return (
          <Box key={item.label + i}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={
                isActive
                  ? "white"
                  : item.isAdd
                    ? "green"
                    : isSelected
                      ? "cyan"
                      : undefined
              }
              bold={isActive || isSelected}
              dimColor={!isFocused && !isSelected}
            >
              {padded}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
});
