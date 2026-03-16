import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { fuzzyMatch, fuzzyScore } from "../../utils/fuzzy.ts";
import { getTheme } from "../../ui/theme.ts";
import { useReleasesContext } from "./releases-context.ts";

export function DefinitionSearch() {
  const {
    config,
    addPinnedReleaseDefinition,
    removePinnedReleaseDefinition,
    contentHeight: height,
    width,
  } = useAppContext();
  const { allDefinitions: definitions, allDefsLoading: loading } =
    useReleasesContext();
  const { navigate } = useRouter();
  const pinnedIds = config.pinnedReleaseDefinitions;

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return definitions;
    return definitions
      .filter((d) => fuzzyMatch(d.name, query))
      .sort((a, b) => fuzzyScore(b.name, query) - fuzzyScore(a.name, query));
  }, [definitions, query]);

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);
  const listHeight = boxHeight - 5;

  const visible = filtered.slice(scrollOffset, scrollOffset + listHeight);

  const toggleDefinition = (index: number) => {
    const def = filtered[index];
    if (!def) return;
    if (pinnedIds.includes(def.id)) {
      removePinnedReleaseDefinition(def.id);
    } else {
      addPinnedReleaseDefinition(def.id);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      navigate("releases");
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => {
        const next = Math.max(0, i - 1);
        if (next < scrollOffset) setScrollOffset(next);
        return next;
      });
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => {
        const next = Math.min(filtered.length - 1, i + 1);
        if (next >= scrollOffset + listHeight) {
          setScrollOffset(next - listHeight + 1);
        }
        return next;
      });
      return;
    }
    if (key.return) {
      toggleDefinition(selectedIndex);
      return;
    }

    // Manual text input
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelectedIndex(0);
      setScrollOffset(0);
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelectedIndex(0);
      setScrollOffset(0);
    }
  });

  // border (2) + paddingX (2) = 4
  const innerWidth = boxWidth - 4;
  const matchCount = filtered.length;
  const totalCount = definitions.length;

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
          Add / Remove Release Definition
        </Text>
        <Text dimColor>
          {" "}
          ({matchCount}/{totalCount})
        </Text>
      </Box>
      <Box>
        <Text>Search: </Text>
        <Text>{query}</Text>
        <Text dimColor>{"\u2588"}</Text>
      </Box>
      {loading ? (
        <Spinner label="Loading definitions..." />
      ) : filtered.length === 0 ? (
        <Text dimColor>
          {query ? "No definitions match" : "No definitions found"}
        </Text>
      ) : (
        visible.map((def, i) => {
          const actualIndex = scrollOffset + i;
          const isPinned = pinnedIds.includes(def.id);
          const isActive = actualIndex === selectedIndex;
          const prefix = isPinned ? "\u2713 " : "  ";
          const label = (prefix + def.name).padEnd(innerWidth);
          return (
            <Box key={def.id}>
              <Text
                backgroundColor={isActive ? "blue" : undefined}
                color={isActive ? "white" : undefined}
              >
                {label}
              </Text>
            </Box>
          );
        })
      )}
      <Box marginTop={0}>
        <Text dimColor>
          Enter: {"add/remove"} | Esc: close | {"\u2191\u2193"}: navigate
        </Text>
      </Box>
    </Box>
  );
}
