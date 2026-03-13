import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner, TextInput } from "@inkjs/ui";
import type { RepoNode } from "../../api/types.ts";
import { fuzzyMatch, fuzzyScore } from "../../utils/fuzzy.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  repos: RepoNode[];
  pinnedRepos: string[]; // qualified: "org/repo"
  loading: boolean;
  onSelect: (qualifiedRepo: string) => void;
  onRemove: (qualifiedRepo: string) => void;
  onClose: () => void;
  height: number;
  width: number;
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

  const multiOrg = useMemo(() => {
    const orgs = new Set(repos.map((r) => r.owner));
    return orgs.size > 1;
  }, [repos]);

  const filtered = useMemo(() => {
    const withQualified = repos.map((r) => ({
      ...r,
      qualified: `${r.owner}/${r.name}`,
      display: multiOrg ? `${r.owner}/${r.name}` : r.name,
    }));

    if (!query) return withQualified;
    return withQualified
      .filter((r) => fuzzyMatch(r.qualified, query))
      .sort(
        (a, b) =>
          fuzzyScore(b.qualified, query) - fuzzyScore(a.qualified, query),
      );
  }, [repos, query, multiOrg]);

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);
  const listHeight = boxHeight - 5;

  const visible = filtered.slice(scrollOffset, scrollOffset + listHeight);

  const toggleRepo = (index: number) => {
    const repo = filtered[index];
    if (!repo) return;
    if (pinnedRepos.includes(repo.qualified)) {
      onRemove(repo.qualified);
    } else {
      onSelect(repo.qualified);
    }
  };

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
    if (key.return) {
      toggleRepo(selectedIndex);
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
      borderColor={getTheme().ui.border}
      paddingX={1}
    >
      <Box>
        <Text bold color={getTheme().ui.heading}>
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
            toggleRepo(selectedIndex);
          }}
        />
      </Box>
      {loading ? (
        <Spinner label="Loading repos..." />
      ) : filtered.length === 0 ? (
        <Text dimColor>{query ? "No repos match" : "No repos found"}</Text>
      ) : (
        visible.map((repo, i) => {
          const actualIndex = scrollOffset + i;
          const isPinned = pinnedRepos.includes(repo.qualified);
          const isActive = actualIndex === selectedIndex;
          return (
            <Box key={repo.qualified}>
              <Text
                backgroundColor={isActive ? "blue" : undefined}
                color={isActive ? "white" : undefined}
              >
                {isPinned ? "✓ " : "  "}
                {repo.display}
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
