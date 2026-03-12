import React from "react";
import { Box, Text } from "ink";
import type { PullRequest } from "../api/types.ts";

interface Props {
  repos: string[]; // qualified: "org/repo"
  selectedRepo: string | null;
  selectedIndex: number;
  isFocused: boolean;
  height: number;
  allPRs: PullRequest[];
  multiOrg: boolean;
}

export function Sidebar({
  repos,
  selectedRepo,
  selectedIndex,
  isFocused,
  height: _height,
  allPRs,
  multiOrg,
}: Props) {
  // Count PRs per repo
  const prCounts = new Map<string, number>();
  for (const pr of allPRs) {
    const key = `${pr.repository.owner.login}/${pr.repository.name}`;
    prCounts.set(key, (prCounts.get(key) ?? 0) + 1);
  }
  const totalCount = allPRs.length;

  function displayName(qualifiedRepo: string): string {
    if (multiOrg) return qualifiedRepo;
    const idx = qualifiedRepo.indexOf("/");
    return idx >= 0 ? qualifiedRepo.slice(idx + 1) : qualifiedRepo;
  }

  const items = [
    {
      label: `All repos (${totalCount})`,
      value: null as string | null,
      isAdd: false,
    },
    ...repos.map((r) => ({
      label: `${displayName(r)} (${prCounts.get(r) ?? 0})`,
      value: r,
      isAdd: false,
    })),
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
