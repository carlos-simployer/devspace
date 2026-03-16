import React, { useState } from "react";
import { Box, Text } from "ink";
import { Overlay } from "../../ui/overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useJiraContext } from "./jira-context.ts";

interface TeamMember {
  name: string;
  accountId: string;
}

// Hardcoded UUX team members — could be fetched from API in the future
const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Carlos Roberto Gomez Jr",
    accountId: "6231c5aa3fbb88006840a173",
  },
  { name: "Sebastian Kreft", accountId: "5fc649e6f8b0120069e4fe01" },
  { name: "Kamila Wozniak", accountId: "61811dcf892c420072d8d054" },
  {
    name: "Ariel Cicero",
    accountId: "712020:0de9b84f-f724-48a4-8a83-3cbc53d572b2",
  },
  {
    name: "Olivier Graziano",
    accountId: "712020:a7f0567d-8ab6-4944-aeb1-0b1fad94a643",
  },
  { name: "Ola Juliussen", accountId: "621cd9dc9c3cce006949ecce" },
];

export function MemberSelect() {
  const { navigate } = useRouter();
  const { contentHeight: height, width } = useAppContext();
  const {
    filterAccountIds,
    setFilterAccountIds,
    setFilterMode,
    setSelectedIndex,
  } = useJiraContext();

  const [cursorIndex, setCursorIndex] = useState(0);
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(filterAccountIds),
  );

  const allEnabled = enabled.size === TEAM_MEMBERS.length;
  const items = [
    {
      label: allEnabled ? "Deselect All" : "Select All",
      isAll: true,
      accountId: "",
    },
    ...TEAM_MEMBERS.map((m) => ({
      label: m.name,
      isAll: false,
      accountId: m.accountId,
    })),
  ];

  const boxWidth = Math.min(50, width - 4);
  const boxHeight = Math.min(height - 4, items.length + 5);
  const innerWidth = boxWidth - 4;

  useRouteShortcuts({
    close: () => navigate("jira"),
    select: () => {
      setFilterAccountIds(enabled);
      if (enabled.size > 0) {
        setFilterMode("person");
      } else {
        setFilterMode("team");
      }
      setSelectedIndex(0);
      navigate("jira");
    },
    toggle: () => {
      const item = items[cursorIndex];
      if (!item) return;
      if (item.isAll) {
        if (allEnabled) {
          setEnabled(new Set());
        } else {
          setEnabled(new Set(TEAM_MEMBERS.map((m) => m.accountId)));
        }
      } else {
        setEnabled((prev) => {
          const next = new Set(prev);
          if (next.has(item.accountId)) {
            next.delete(item.accountId);
          } else {
            next.add(item.accountId);
          }
          return next;
        });
      }
    },
    up: () => setCursorIndex((i) => Math.max(0, i - 1)),
    down: () => setCursorIndex((i) => Math.min(items.length - 1, i + 1)),
  });

  return (
    <Overlay
      title="Filter by Team Member"
      width={boxWidth}
      height={boxHeight}
      footer={<Text dimColor>Space: toggle | Enter: apply | Esc: cancel</Text>}
    >
      {items.map((item, i) => {
        const isActive = i === cursorIndex;
        const isEnabled = item.isAll ? allEnabled : enabled.has(item.accountId);
        const checkbox = isEnabled ? "[x]" : "[ ]";
        const label = `${checkbox} ${item.label}`.padEnd(innerWidth);

        return (
          <Box key={item.accountId || "all"}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={isActive ? "white" : undefined}
              bold={item.isAll}
            >
              {label}
            </Text>
          </Box>
        );
      })}
    </Overlay>
  );
}
