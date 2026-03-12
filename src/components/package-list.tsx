import React from "react";
import { Box, Text } from "ink";
import type { TrackedPackage } from "../api/types.ts";

interface Props {
  packages: TrackedPackage[];
  selectedIndex: number;
  isFocused: boolean;
  width: number;
}

export function PackageList({
  packages,
  selectedIndex,
  isFocused,
  width,
}: Props) {
  const items = [
    ...packages.map((p) => ({ label: p.name, isAdd: false, pkg: p })),
    { label: "[+] Add package", isAdd: true, pkg: null },
  ];

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
              {isSelected && !item.isAdd ? "● " : "  "}
              {item.label}
              {item.pkg?.loading ? " ..." : ""}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
