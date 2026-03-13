import React from "react";
import { Box, Text } from "ink";
import type { PullRequest } from "../../api/types.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  repos: string[]; // qualified: "org/repo"
  selectedRepo: string | null;
  selectedIndex: number;
  isFocused: boolean;
  height: number;
  width: number;
  allPRs: PullRequest[];
  multiOrg: boolean;
}

export function Sidebar({
  repos,
  selectedRepo,
  selectedIndex,
  isFocused,
  height: _height,
  width,
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
        Repos
      </Text>
      {items.map((item, i) => {
        const isActive = isFocused && i === selectedIndex;
        const isCurrentFilter = !item.isAdd && item.value === selectedRepo;
        const prefix = isCurrentFilter && !item.isAdd ? "● " : "  ";
        const text = prefix + item.label;
        const padded = isActive ? text.padEnd(innerWidth) : text;

        return (
          <Box key={item.label + i}>
            <Text
              inverse={isActive}
              color={
                isActive
                  ? undefined
                  : item.isAdd
                    ? getTheme().list.addAction
                    : isCurrentFilter
                      ? "white"
                      : undefined
              }
              bold={isActive || isCurrentFilter}
              dimColor={!isFocused && !isCurrentFilter && !isActive}
            >
              {padded}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
