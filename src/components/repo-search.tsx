import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { RepoNode } from "../api/types.ts";

interface Props {
  repos: RepoNode[];
  pinnedRepos: string[];
  loading: boolean;
  onSelect: (repo: string) => void;
  onRemove: (repo: string) => void;
  onClose: () => void;
  height: number;
  width: number;
}

function fuzzyMatch(name: string, query: string): boolean {
  const lower = name.toLowerCase();
  const q = query.toLowerCase();
  // Check simple includes first
  if (lower.includes(q)) return true;
  // Fuzzy: all query chars appear in order
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(name: string, query: string): number {
  const lower = name.toLowerCase();
  const q = query.toLowerCase();
  // Exact match at start scores highest
  if (lower.startsWith(q)) return 3;
  // Contains as substring
  if (lower.includes(q)) return 2;
  // Fuzzy match
  return 1;
}

export function RepoSearch({
  repos,
  pinnedRepos,
  loading,
  onSelect,
  onRemove,
  onClose,
  height,
  width,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return repos;
    return repos
      .filter((r) => fuzzyMatch(r.name, query))
      .sort((a, b) => fuzzyScore(b.name, query) - fuzzyScore(a.name, query));
  }, [repos, query]);

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);
  // 3 lines: title, search, footer
  const listHeight = boxHeight - 5;

  const visible = filtered.slice(scrollOffset, scrollOffset + listHeight);

  useInput((_input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => {
        const next = Math.max(0, i - 1);
        if (next < scrollOffset) setScrollOffset(next);
        return next;
      });
    }
    if (key.downArrow) {
      setSelectedIndex((i) => {
        const next = Math.min(filtered.length - 1, i + 1);
        if (next >= scrollOffset + listHeight) {
          setScrollOffset(next - listHeight + 1);
        }
        return next;
      });
    }
    if (key.return && filtered[selectedIndex]) {
      const repo = filtered[selectedIndex]!.name;
      if (pinnedRepos.includes(repo)) {
        onRemove(repo);
      } else {
        onSelect(repo);
      }
    }
  });

  const matchCount = filtered.length;
  const totalCount = repos.length;

  return (
    <Box
      flexDirection="column"
      width={boxWidth}
      height={boxHeight}
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
    >
      <Box>
        <Text bold color="cyan">
          Add / Remove Repository
        </Text>
        <Text dimColor>
          {" "}
          ({matchCount}/{totalCount})
        </Text>
      </Box>
      <Box>
        <Text>Search: </Text>
        <TextInput
          placeholder="type to filter..."
          onChange={(val) => {
            setQuery(val);
            setSelectedIndex(0);
            setScrollOffset(0);
          }}
          onSubmit={() => {
            if (filtered[selectedIndex]) {
              const repo = filtered[selectedIndex]!.name;
              if (pinnedRepos.includes(repo)) {
                onRemove(repo);
              } else {
                onSelect(repo);
              }
            }
          }}
        />
      </Box>
      {loading ? (
        <Text color="yellow">Loading repos...</Text>
      ) : filtered.length === 0 ? (
        <Text dimColor>{query ? "No repos match" : "No repos found"}</Text>
      ) : (
        visible.map((repo, i) => {
          const actualIndex = scrollOffset + i;
          const isPinned = pinnedRepos.includes(repo.name);
          const isActive = actualIndex === selectedIndex;
          return (
            <Box key={repo.name}>
              <Text
                backgroundColor={isActive ? "blue" : undefined}
                color={isActive ? "white" : undefined}
              >
                {isPinned ? "✓ " : "  "}
                {repo.name}
              </Text>
            </Box>
          );
        })
      )}
      <Box marginTop={0}>
        <Text dimColor>
          Enter: {"{add/remove}"} │ Esc: close │ ↑↓: navigate
        </Text>
      </Box>
    </Box>
  );
}
