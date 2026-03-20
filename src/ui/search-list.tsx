import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { Dialog } from "./dialog.tsx";
import { getTheme } from "./theme.ts";
import { fuzzyMatch, fuzzyScore } from "../utils/fuzzy.ts";

export interface SearchListItem {
  key: string;
  label: string;
  isSelected?: boolean;
}

export interface SearchListProps {
  title: string;
  items: SearchListItem[];
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  width: number;
  height: number;
  onSelect: (index: number, item: SearchListItem) => void;
  onClose: () => void;
  renderItem?: (
    item: SearchListItem,
    index: number,
    isActive: boolean,
  ) => React.ReactNode;
}

export function SearchList({
  title,
  items,
  loading = false,
  loadingLabel,
  emptyLabel,
  width,
  height,
  onSelect,
  onClose,
  renderItem,
}: SearchListProps) {
  const theme = getTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items
      .filter((item) => fuzzyMatch(item.label, query))
      .sort((a, b) => fuzzyScore(b.label, query) - fuzzyScore(a.label, query));
  }, [items, query]);

  // Panel borders (2) + title row (1) + search row (1) + footer row (1) = 5
  const listHeight = Math.max(0, height - 5);

  const visible = filtered.slice(scrollOffset, scrollOffset + listHeight);

  // Panel borders (2) + paddingX (2*1) = 4
  const innerWidth = width - 4;

  useInput((input, key) => {
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
      if (filtered.length > 0) {
        onSelect(selectedIndex, filtered[selectedIndex]!);
      }
      return;
    }

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

  const matchCount = filtered.length;
  const totalCount = items.length;

  return (
    <Dialog title={title} width={width} height={height}>
      <Box>
        <Text bold color={theme.ui.heading}>
          {title}
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
        <Spinner label={loadingLabel ?? "Loading..."} />
      ) : filtered.length === 0 ? (
        <Text dimColor>
          {emptyLabel ?? (query ? "No matches" : "No items")}
        </Text>
      ) : (
        visible.map((item, i) => {
          const actualIndex = scrollOffset + i;
          const isActive = actualIndex === selectedIndex;

          if (renderItem) {
            return (
              <Box key={item.key}>
                {renderItem(item, actualIndex, isActive)}
              </Box>
            );
          }

          const prefix = item.isSelected ? "\u2713 " : "  ";
          const label = (prefix + item.label).padEnd(innerWidth);

          return (
            <Box key={item.key}>
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
        <Text dimColor>Enter: select │ Esc: close │ ↑↓: navigate</Text>
      </Box>
    </Dialog>
  );
}
