import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { AppView } from "../../api/types.ts";
import { REFRESH_PRESETS } from "../../api/types.ts";
import { handleGlobalKeys } from "../../hooks/use-global-keys.ts";

interface Props {
  orgs: string[];
  addOrg: (org: string) => void;
  removeOrg: (org: string) => void;
  refreshInterval: number;
  setRefreshInterval: (seconds: number) => void;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  height: number;
  width: number;
  onQuit: () => void;
}

function formatInterval(seconds: number): string {
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

type Section = "orgs" | "settings";

export function ConfigView({
  orgs,
  addOrg,
  removeOrg,
  refreshInterval,
  setRefreshInterval,
  onSwitchView,
  height,
  width,
  onQuit,
}: Props) {
  const [section, setSection] = useState<Section>("orgs");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddOrg, setShowAddOrg] = useState(false);

  const orgItems = [
    ...orgs.map((org) => ({ label: org, isAdd: false })),
    { label: "[+] Add organization", isAdd: true },
  ];

  const refreshPresetItems = REFRESH_PRESETS.map((s) => ({
    label: formatInterval(s),
    value: s,
    active: s === refreshInterval,
  }));

  const items = section === "orgs" ? orgItems : refreshPresetItems;

  useInput((input, key) => {
    if (showAddOrg) {
      if (key.escape) setShowAddOrg(false);
      return;
    }

    if (
      handleGlobalKeys(input, key, {
        onQuit,
        onSwitchView,
        onHelp: () => {},
      })
    )
      return;

    // Switch between sections with left/right
    if (key.leftArrow || key.rightArrow) {
      setSection((s) => (s === "orgs" ? "settings" : "orgs"));
      setSelectedIndex(0);
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

    if (section === "orgs") {
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
    }

    if (section === "settings") {
      if (key.return) {
        const preset = refreshPresetItems[selectedIndex];
        if (preset) setRefreshInterval(preset.value);
      }
    }
  });

  return (
    <Box height={height} width={width} flexDirection="column">
      <Box flexGrow={1} flexDirection="row">
        {/* Organizations */}
        <Box flexDirection="column" paddingX={2} width="50%">
          <Text bold inverse={section === "orgs"}>
            {" "}
            Organizations{" "}
          </Text>
          <Text dimColor>
            Repos and dependency searches use all configured orgs.
          </Text>
          <Box height={1} />
          {orgItems.map((item, i) => {
            const isActive = section === "orgs" && i === selectedIndex;

            return (
              <Box key={item.label + i}>
                <Text
                  inverse={isActive}
                  color={
                    isActive ? undefined : item.isAdd ? "green" : undefined
                  }
                  bold={isActive}
                >
                  {isActive ? "> " : "  "}
                  {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Settings */}
        <Box flexDirection="column" paddingX={2} width="50%">
          <Text bold inverse={section === "settings"}>
            {" "}
            Settings{" "}
          </Text>
          <Text dimColor>PR auto-refresh interval.</Text>
          <Box height={1} />
          {refreshPresetItems.map((item, i) => {
            const isActive = section === "settings" && i === selectedIndex;

            return (
              <Box key={item.value}>
                <Text
                  inverse={isActive}
                  color={
                    isActive ? undefined : item.active ? "green" : undefined
                  }
                  bold={isActive || item.active}
                >
                  {isActive ? "> " : "  "}
                  {item.active ? "● " : "○ "}
                  {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>
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
          <Text dimColor> │ Refresh: </Text>
          <Text bold>{formatInterval(refreshInterval)}</Text>
          <Text dimColor> │ ←/→ switch section</Text>
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
