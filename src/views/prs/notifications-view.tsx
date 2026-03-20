import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { Panel } from "../../ui/panel.tsx";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { relativeTime } from "../../utils/time.ts";
import { getTheme } from "../../ui/theme.ts";
import { usePrsContext } from "./prs-context.ts";

/**
 * NotificationsView — reads data from PrsContext.
 * Rendered as a nested route child of PrsLayout.
 */
export function NotificationsView() {
  const { height, width } = useAppContext();
  const { navigate } = useRouter();
  const { notifications, notifLoading: loading } = usePrsContext();

  const [selectedIndex, setSelectedIndex] = useState(0);

  useRouteShortcuts({});

  // Header height (same as PrsLayout header: ~3 lines)
  const sharedHeaderHeight = 3;
  const panelHeight = height - sharedHeaderHeight;

  useInput((input, key) => {
    if (key.escape) {
      navigate("prs");
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
        openInBrowser(webUrl);
      }
    }
  });

  // Panel borders take 2 rows, footer takes 1
  const listHeight = panelHeight - 3;
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

  const count =
    notifications.length > 0
      ? `${selectedIndex + 1} of ${notifications.length}`
      : undefined;

  return (
    <Panel
      title="Notifications"
      focused={true}
      width={width}
      height={panelHeight}
      count={count}
    >
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
      <Text dimColor>Esc: close │ Enter/o: open in browser │ ↑↓: navigate</Text>
    </Panel>
  );
}
