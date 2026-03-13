import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { AppView } from "../api/types.ts";

interface Props {
  orgs: string[];
  addOrg: (org: string) => void;
  removeOrg: (org: string) => void;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  height: number;
  width: number;
  onQuit: () => void;
}

export function ConfigView({
  orgs,
  addOrg,
  removeOrg,
  onSwitchView,
  height,
  width,
  onQuit,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddOrg, setShowAddOrg] = useState(false);

  const items = [
    ...orgs.map((org) => ({ label: org, isAdd: false })),
    { label: "[+] Add organization", isAdd: true },
  ];

  useInput((input, key) => {
    if (showAddOrg) {
      if (key.escape) setShowAddOrg(false);
      return;
    }

    if (input === "q") {
      onQuit();
      return;
    }

    if (key.tab) {
      onSwitchView(undefined, key.shift);
      return;
    }
    if (input === "1") {
      onSwitchView("prs");
      return;
    }
    if (input === "2") {
      onSwitchView("dependencies");
      return;
    }
    if (input === "3") {
      onSwitchView("config");
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(items.length - 1, i + 1));
      return;
    }

    if (input === "+") {
      setShowAddOrg(true);
      return;
    }

    if (key.return) {
      if (selectedIndex === orgs.length) {
        setShowAddOrg(true);
      }
      return;
    }

    if ((input === "d" || input === "-") && selectedIndex < orgs.length) {
      const org = orgs[selectedIndex];
      if (org) {
        removeOrg(org);
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
    }
  });

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Organizations */}
      <Box flexGrow={1} flexDirection="column" paddingX={2}>
        <Text bold>Organizations</Text>
        <Text dimColor>
          Repos and dependency searches use all configured orgs.
        </Text>
        <Box height={1} />
        {items.map((item, i) => {
          const isActive = i === selectedIndex;

          return (
            <Box key={item.label + i}>
              <Text
                backgroundColor={isActive ? "blue" : undefined}
                color={isActive ? "white" : item.isAdd ? "green" : "cyan"}
                bold={isActive}
              >
                {isActive ? "> " : "  "}
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Status bar */}
      <Box
        width={width}
        flexDirection="column"
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
      >
        <Text>
          <Text dimColor>Orgs: </Text>
          <Text bold>{orgs.length}</Text>
        </Text>
      </Box>

      {/* Add org overlay */}
      {showAddOrg && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor="green"
            paddingX={1}
          >
            <Text bold color="green">
              Add Organization
            </Text>
            <Box>
              <Text>Name: </Text>
              <TextInput
                placeholder="type org name..."
                onSubmit={(val) => {
                  if (val.trim()) {
                    addOrg(val.trim());
                  }
                  setShowAddOrg(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: add │ Esc: cancel</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
