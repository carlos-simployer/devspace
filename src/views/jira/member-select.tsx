import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Overlay } from "../../ui/overlay.tsx";

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

interface Props {
  onSelect: (accountId: string) => void;
  onClose: () => void;
  height: number;
  width: number;
}

export function MemberSelect({ onSelect, onClose, height, width }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const boxWidth = Math.min(50, width - 4);
  const boxHeight = Math.min(height - 4, TEAM_MEMBERS.length + 5);
  const innerWidth = boxWidth - 4; // border (2) + paddingX (2)

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(TEAM_MEMBERS.length - 1, i + 1));
      return;
    }
    if (key.return) {
      const member = TEAM_MEMBERS[selectedIndex];
      if (member) {
        onSelect(member.accountId);
      }
      return;
    }
  });

  return (
    <Overlay
      title="Select Team Member"
      width={boxWidth}
      height={boxHeight}
      footer={
        <Text dimColor>
          Enter: select | Esc: cancel | {"\u2191\u2193"}: navigate
        </Text>
      }
    >
      {TEAM_MEMBERS.map((member, i) => {
        const isActive = i === selectedIndex;
        const label = member.name.padEnd(innerWidth);
        return (
          <Box key={member.accountId}>
            <Text
              backgroundColor={isActive ? "blue" : undefined}
              color={isActive ? "white" : undefined}
            >
              {label}
            </Text>
          </Box>
        );
      })}
    </Overlay>
  );
}
