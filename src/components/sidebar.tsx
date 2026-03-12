import React from "react";
import { Box, Text } from "ink";

interface Props {
  repos: string[];
  selectedRepo: string | null;
  selectedIndex: number;
  isFocused: boolean;
  height: number;
}

export function Sidebar({
  repos,
  selectedRepo,
  selectedIndex,
  isFocused,
  height: _height,
}: Props) {
  // Items: "All repos" + each repo + "[+] Add repo"
  const items = [
    { label: "All repos", value: null as string | null, isAdd: false },
    ...repos.map((r) => ({ label: r, value: r, isAdd: false })),
    { label: "[+] Add repo", value: null, isAdd: true },
  ];

  return (
    <Box
      flexDirection="column"
      width={26}
      borderStyle="single"
      borderRight
      borderLeft={false}
      borderTop={false}
      borderBottom={false}
      paddingRight={1}
    >
      <Text bold dimColor={!isFocused}>
        Repos
      </Text>
      {items.map((item, i) => {
        const isActive = isFocused && i === selectedIndex;
        const isCurrentFilter = !item.isAdd && item.value === selectedRepo;

        return (
          <Box key={item.label + i}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={
                isActive
                  ? "white"
                  : item.isAdd
                    ? "green"
                    : isCurrentFilter
                      ? "cyan"
                      : undefined
              }
              bold={isActive || isCurrentFilter}
              dimColor={!isFocused && !isCurrentFilter}
            >
              {isCurrentFilter && !item.isAdd ? "● " : "  "}
              {item.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
