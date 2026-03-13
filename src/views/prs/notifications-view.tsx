import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import type { GitHubNotification } from "../../hooks/use-notifications.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";

interface Props {
  notifications: GitHubNotification[];
  loading: boolean;
  height: number;
  width: number;
  onClose: () => void;
  onOpenInBrowser: (url: string) => void;
}

export function NotificationsView({
  notifications,
  loading,
  height,
  width,
  onClose,
  onOpenInBrowser,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(notifications.length - 1, i + 1));
    }
    if (key.return || input === "o") {
      const n = notifications[selectedIndex];
      if (n?.subject.url) {
        // Convert API URL to web URL
        const webUrl = n.subject.url
          .replace("api.github.com/repos", "github.com")
          .replace("/pulls/", "/pull/");
        onOpenInBrowser(webUrl);
      }
    }
  });

  const listHeight = height - 5;
  let startIndex = 0;
  if (notifications.length > listHeight) {
    const halfView = Math.floor(listHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        notifications.length - listHeight,
      );
    }
  }
  const visible = notifications.slice(startIndex, startIndex + listHeight);

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color={getTheme().ui.heading}>
          Notifications
        </Text>
        <Text dimColor> ({notifications.length} PR notifications)</Text>
      </Box>
      {loading ? (
        <Spinner label="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <Text dimColor>No PR notifications</Text>
      ) : (
        visible.map((n, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === selectedIndex;
          const time = relativeTime(n.updated_at);
          const repoName = n.repository.full_name.padEnd(30).slice(0, 30);
          const maxTitle = Math.max(10, width - 55);
          const title = n.subject.title.slice(0, maxTitle);

          return (
            <Box key={n.id}>
              <Text
                backgroundColor={isSelected ? "blue" : undefined}
                color={isSelected ? "white" : undefined}
              >
                {isSelected ? "> " : "  "}
                {n.unread ? (
                  <Text
                    bold
                    color={isSelected ? "white" : getTheme().activity.unread}
                  >
                    {"● "}
                  </Text>
                ) : (
                  "  "
                )}
                <Text dimColor={!isSelected}>{repoName}</Text>
                {title}
                <Text dimColor={!isSelected}>
                  {" "}
                  {n.reason.padEnd(15).slice(0, 15)} {time.text}
                </Text>
              </Text>
            </Box>
          );
        })
      )}
      <Box position="absolute" marginTop={height - 2} marginLeft={2}>
        <Text dimColor>
          Esc: close │ Enter/o: open in browser │ ↑↓: navigate
        </Text>
      </Box>
    </Box>
  );
}
