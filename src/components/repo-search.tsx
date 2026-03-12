import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { RepoNode } from "../api/types.ts";

interface Props {
  repos: RepoNode[];
  pinnedRepos: string[]; // qualified: "org/repo"
  loading: boolean;
  onSelect: (repo: string) => void;
  onRemove: (repo: string) => void;
  onClose: () => void;
  height: number;
  width: number;
  orgs: string[];
  activeOrg: string;
  onSwitchOrg: (org: string) => void;
  onAddOrg: (org: string) => void;
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
  orgs,
  activeOrg,
  onSwitchOrg,
  onAddOrg,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [mode, setMode] = useState<"repos" | "orgs">(
    activeOrg ? "repos" : "orgs",
  );
  const [orgSelectedIndex, setOrgSelectedIndex] = useState(0);

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
      if (mode === "orgs") {
        setMode("repos");
        return;
      }
      onClose();
      return;
    }
    if (key.tab) {
      setMode((m) => (m === "repos" ? "orgs" : "repos"));
      return;
    }

    if (mode === "orgs") {
      if (key.upArrow) {
        setOrgSelectedIndex((i) => Math.max(0, i - 1));
      }
      if (key.downArrow) {
        setOrgSelectedIndex((i) => Math.min(orgs.length, i + 1));
      }
      if (key.return) {
        if (orgSelectedIndex < orgs.length) {
          onSwitchOrg(orgs[orgSelectedIndex]!);
          setMode("repos");
        }
      }
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
      const qualified = `${activeOrg}/${repo}`;
      if (pinnedRepos.includes(qualified)) {
        onRemove(qualified);
      } else {
        onSelect(repo);
      }
    }
  });

  const matchCount = filtered.length;
  const totalCount = repos.length;

  if (mode === "orgs") {
    return (
      <Box
        flexDirection="column"
        width={boxWidth}
        height={boxHeight}
        borderStyle="round"
        borderColor="magenta"
        paddingX={1}
      >
        <Box>
          <Text bold color="magenta">
            Switch Organization
          </Text>
          <Text dimColor> (Tab: back to repos)</Text>
        </Box>
        {orgs.map((org, i) => (
          <Box key={org}>
            <Text
              backgroundColor={i === orgSelectedIndex ? "blue" : undefined}
              color={
                i === orgSelectedIndex
                  ? "white"
                  : org === activeOrg
                    ? "cyan"
                    : undefined
              }
              bold={org === activeOrg}
            >
              {org === activeOrg ? "● " : "  "}
              {org}
            </Text>
          </Box>
        ))}
        <Box>
          <Text
            backgroundColor={
              orgSelectedIndex === orgs.length ? "blue" : undefined
            }
            color={orgSelectedIndex === orgs.length ? "white" : "green"}
          >
            {"  [+] Add organization"}
          </Text>
        </Box>
        {orgSelectedIndex === orgs.length && (
          <Box>
            <Text>Org name: </Text>
            <TextInput
              placeholder="type org name..."
              onSubmit={(val) => {
                if (val.trim()) {
                  onAddOrg(val.trim());
                  setMode("repos");
                }
              }}
            />
          </Box>
        )}
        <Box marginTop={0}>
          <Text dimColor>Enter: select │ Tab: repos │ Esc: close</Text>
        </Box>
      </Box>
    );
  }

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
        <Text dimColor> │ Org: </Text>
        <Text color="cyan" bold>
          {activeOrg}
        </Text>
        <Text dimColor> (Tab: switch)</Text>
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
              const qualified = `${activeOrg}/${repo}`;
              if (pinnedRepos.includes(qualified)) {
                onRemove(qualified);
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
          const qualified = `${activeOrg}/${repo.name}`;
          const isPinned = pinnedRepos.includes(qualified);
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
          Enter: {"{add/remove}"} │ Tab: orgs │ Esc: close │ ↑↓: navigate
        </Text>
      </Box>
    </Box>
  );
}
