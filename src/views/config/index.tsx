import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { exec } from "child_process";
import { join } from "path";
import { homedir } from "os";
import type { AppView } from "../../api/types.ts";
import { REFRESH_PRESETS } from "../../api/types.ts";
import {
  clearQueryCache,
  getQueryCacheSize,
} from "../../utils/query-persister.ts";
import { useShortcuts } from "../../hooks/use-shortcuts.ts";
import { useView } from "../../ui/view-context.ts";
import {
  getTheme,
  getThemeNames,
  THEMES,
  type ThemeName,
} from "../../ui/theme.ts";

interface Props {
  orgs: string[];
  addOrg: (org: string) => void;
  removeOrg: (org: string) => void;
  refreshInterval: number;
  setRefreshInterval: (seconds: number) => void;
  themeName: string;
  setThemeName: (name: string) => void;
  azureOrg: string;
  azureProject: string;
  setAzureOrg: (org: string) => void;
  setAzureProject: (project: string) => void;
  jiraSite: string;
  jiraEmail: string;
  jiraToken: string;
  jiraProject: string;
  setJiraSite: (site: string) => void;
  setJiraEmail: (email: string) => void;
  setJiraToken: (token: string) => void;
  setJiraProject: (project: string) => void;
  persistCache: boolean;
  setPersistCache: (enabled: boolean) => void;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  height: number;
  width: number;
  onQuit: () => void;
}

function formatInterval(seconds: number): string {
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

type Section = "orgs" | "settings" | "theme" | "azure" | "jira" | "cache";
const SECTIONS: Section[] = [
  "orgs",
  "settings",
  "theme",
  "azure",
  "jira",
  "cache",
];

export function ConfigView({
  orgs,
  addOrg,
  removeOrg,
  refreshInterval,
  setRefreshInterval,
  themeName,
  setThemeName,
  azureOrg,
  azureProject,
  setAzureOrg,
  setAzureProject,
  jiraSite,
  jiraEmail,
  jiraToken,
  jiraProject,
  setJiraSite,
  setJiraEmail,
  setJiraToken,
  setJiraProject,
  persistCache,
  setPersistCache,
  onSwitchView: _onSwitchView,
  height,
  width,
  onQuit,
}: Props) {
  const { view, setView } = useView();
  const [section, setSection] = useState<Section>("orgs");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showEditAzureOrg, setShowEditAzureOrg] = useState(false);
  const [showEditAzureProject, setShowEditAzureProject] = useState(false);
  const [showEditJiraSite, setShowEditJiraSite] = useState(false);
  const [showEditJiraEmail, setShowEditJiraEmail] = useState(false);
  const [showEditJiraToken, setShowEditJiraToken] = useState(false);
  const [showEditJiraProject, setShowEditJiraProject] = useState(false);

  // Sync overlay state -> ViewContext so shortcuts are scoped correctly
  useEffect(() => {
    if (showAddOrg) {
      setView("config.addOrg");
    } else if (showEditAzureOrg) {
      setView("config.editAzureOrg");
    } else if (showEditAzureProject) {
      setView("config.editAzureProject");
    } else if (showEditJiraSite) {
      setView("config.editJiraSite");
    } else if (showEditJiraEmail) {
      setView("config.editJiraEmail");
    } else if (showEditJiraToken) {
      setView("config.editJiraToken");
    } else if (showEditJiraProject) {
      setView("config.editJiraProject");
    } else if (
      view === "config.addOrg" ||
      view === "config.editAzureOrg" ||
      view === "config.editAzureProject" ||
      view === "config.editJiraSite" ||
      view === "config.editJiraEmail" ||
      view === "config.editJiraToken" ||
      view === "config.editJiraProject"
    ) {
      setView("config");
    }
  }, [
    showAddOrg,
    showEditAzureOrg,
    showEditAzureProject,
    showEditJiraSite,
    showEditJiraEmail,
    showEditJiraToken,
    showEditJiraProject,
  ]);

  const orgItems = [
    ...orgs.map((org) => ({ label: org, isAdd: false })),
    { label: "[+] Add organization", isAdd: true },
  ];

  const refreshPresetItems = REFRESH_PRESETS.map((s) => ({
    label: formatInterval(s),
    value: s,
    active: s === refreshInterval,
  }));

  const themeItems = getThemeNames().map((name) => ({
    name,
    label: THEMES[name].name,
    active: name === themeName,
  }));

  const azureItems = [
    {
      label: `Organization: ${azureOrg || "[not set]"}`,
      field: "org" as const,
    },
    {
      label: `Project: ${azureProject || "[not set]"}`,
      field: "project" as const,
    },
  ];

  const jiraItems = [
    {
      label: `Site: ${jiraSite || "[not set]"}`,
      field: "site" as const,
    },
    {
      label: `Email: ${jiraEmail || "[not set]"}`,
      field: "email" as const,
    },
    {
      label: `API Token: ${jiraToken ? "●●●●●●●●" : "[not set]"}`,
      field: "token" as const,
    },
    {
      label: `Project: ${jiraProject || "[not set]"}`,
      field: "project" as const,
    },
  ];

  const cacheSize = getQueryCacheSize();
  const cacheSizeStr =
    cacheSize > 1024 * 1024
      ? `${(cacheSize / 1024 / 1024).toFixed(1)} MB`
      : cacheSize > 1024
        ? `${(cacheSize / 1024).toFixed(0)} KB`
        : cacheSize > 0
          ? `${cacheSize} B`
          : "empty";

  const cacheItems = [
    {
      label: persistCache ? "● Enabled" : "○ Disabled",
      action: "toggle" as const,
    },
    { label: `Clear cache (${cacheSizeStr})`, action: "clear" as const },
  ];

  const items =
    section === "orgs"
      ? orgItems
      : section === "settings"
        ? refreshPresetItems
        : section === "theme"
          ? themeItems
          : section === "azure"
            ? azureItems
            : section === "jira"
              ? jiraItems
              : section === "cache"
                ? cacheItems
                : azureItems;

  // Handle escape in overlay sub-views via a minimal useInput
  // (TextInput captures most keys; we only need escape to close)
  const anyOverlayOpen =
    showAddOrg ||
    showEditAzureOrg ||
    showEditAzureProject ||
    showEditJiraSite ||
    showEditJiraEmail ||
    showEditJiraToken ||
    showEditJiraProject;

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (showAddOrg) setShowAddOrg(false);
        else if (showEditAzureOrg) setShowEditAzureOrg(false);
        else if (showEditAzureProject) setShowEditAzureProject(false);
        else if (showEditJiraSite) setShowEditJiraSite(false);
        else if (showEditJiraEmail) setShowEditJiraEmail(false);
        else if (showEditJiraToken) setShowEditJiraToken(false);
        else if (showEditJiraProject) setShowEditJiraProject(false);
      }
    },
    {
      isActive: anyOverlayOpen,
    },
  );

  // Main view shortcuts (only active when no overlay is open)
  useShortcuts({
    quit: onQuit,
    add: () => {
      if (section === "orgs") setShowAddOrg(true);
    },
    remove: () => {
      if (section === "orgs" && selectedIndex < orgs.length) {
        const org = orgs[selectedIndex];
        if (org) {
          removeOrg(org);
          setSelectedIndex((i) => Math.max(0, i - 1));
        }
      }
    },
    select: () => {
      if (section === "orgs") {
        if (selectedIndex === orgs.length) {
          setShowAddOrg(true);
        }
      } else if (section === "settings") {
        const preset = refreshPresetItems[selectedIndex];
        if (preset) setRefreshInterval(preset.value);
      } else if (section === "theme") {
        const item = themeItems[selectedIndex];
        if (item) setThemeName(item.name);
      } else if (section === "azure") {
        if (selectedIndex === 0) setShowEditAzureOrg(true);
        if (selectedIndex === 1) setShowEditAzureProject(true);
      } else if (section === "jira") {
        if (selectedIndex === 0) setShowEditJiraSite(true);
        if (selectedIndex === 1) setShowEditJiraEmail(true);
        if (selectedIndex === 2) setShowEditJiraToken(true);
        if (selectedIndex === 3) setShowEditJiraProject(true);
      } else if (section === "cache") {
        const item = cacheItems[selectedIndex];
        if (item?.action === "toggle") setPersistCache(!persistCache);
        if (item?.action === "clear") clearQueryCache();
      }
    },
    editConfig: () => {
      const configPath = join(
        homedir(),
        ".config",
        "github-pr-dash",
        "config.json",
      );
      try {
        exec(`code "${configPath}"`);
      } catch {
        // ignore
      }
    },
    up: () => setSelectedIndex((i) => Math.max(0, i - 1)),
    down: () => setSelectedIndex((i) => Math.min(items.length - 1, i + 1)),
    left: () => {
      setSection((s) => {
        const idx = SECTIONS.indexOf(s);
        const next = (idx - 1 + SECTIONS.length) % SECTIONS.length;
        return SECTIONS[next]!;
      });
      setSelectedIndex(0);
    },
    right: () => {
      setSection((s) => {
        const idx = SECTIONS.indexOf(s);
        const next = (idx + 1) % SECTIONS.length;
        return SECTIONS[next]!;
      });
      setSelectedIndex(0);
    },
  });

  return (
    <Box height={height} width={width} flexDirection="column">
      <Box flexGrow={1} flexDirection="row">
        {/* Organizations */}
        <Box flexDirection="column" paddingX={2} width="16%">
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
                    isActive
                      ? undefined
                      : item.isAdd
                        ? getTheme().list.addAction
                        : undefined
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
        <Box flexDirection="column" paddingX={2} width="16%">
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
                    isActive
                      ? undefined
                      : item.active
                        ? getTheme().ui.activeIndicator
                        : undefined
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

        {/* Theme */}
        <Box flexDirection="column" paddingX={2} width="16%">
          <Text bold inverse={section === "theme"}>
            {" "}
            Theme{" "}
          </Text>
          <Text dimColor>Color theme for the UI.</Text>
          <Box height={1} />
          {themeItems.map((item, i) => {
            const isActive = section === "theme" && i === selectedIndex;
            const theme = THEMES[item.name as ThemeName];

            return (
              <Box key={item.name}>
                <Text
                  inverse={isActive}
                  color={
                    isActive
                      ? undefined
                      : item.active
                        ? getTheme().ui.activeIndicator
                        : undefined
                  }
                  bold={isActive || item.active}
                >
                  {isActive ? "> " : "  "}
                  {item.active ? "● " : "○ "}
                  {item.label}
                </Text>
                {!isActive && (
                  <Text>
                    {"  "}
                    <Text color={theme.status.success}>●</Text>
                    <Text color={theme.status.failure}>●</Text>
                    <Text color={theme.status.pending}>●</Text>
                    <Text color={theme.ui.border}>●</Text>
                  </Text>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Azure DevOps */}
        <Box flexDirection="column" paddingX={2} width="16%">
          <Text bold inverse={section === "azure"}>
            {" "}
            Azure DevOps{" "}
          </Text>
          <Text dimColor>Organization and project for Pipelines/Releases.</Text>
          <Box height={1} />
          {azureItems.map((item, i) => {
            const isActive = section === "azure" && i === selectedIndex;

            return (
              <Box key={item.field}>
                <Text inverse={isActive} bold={isActive}>
                  {isActive ? "> " : "  "}
                  {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Jira */}
        <Box flexDirection="column" paddingX={2} width="16%">
          <Text bold inverse={section === "jira"}>
            {" "}
            Jira{" "}
          </Text>
          <Text dimColor>Jira Cloud connection settings.</Text>
          <Box height={1} />
          {jiraItems.map((item, i) => {
            const isActive = section === "jira" && i === selectedIndex;

            return (
              <Box key={item.field}>
                <Text inverse={isActive} bold={isActive}>
                  {isActive ? "> " : "  "}
                  {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Cache */}
        <Box flexDirection="column" paddingX={2} width="16%">
          <Text bold inverse={section === "cache"}>
            {" "}
            Cache{" "}
          </Text>
          <Text dimColor>Persist data across restarts.</Text>
          <Box height={1} />
          {cacheItems.map((item, i) => {
            const isActive = section === "cache" && i === selectedIndex;

            return (
              <Box key={item.action}>
                <Text
                  inverse={isActive}
                  bold={isActive}
                  color={
                    isActive
                      ? undefined
                      : item.action === "toggle" && persistCache
                        ? getTheme().ui.activeIndicator
                        : item.action === "clear"
                          ? getTheme().status.failure
                          : undefined
                  }
                >
                  {isActive ? "> " : "  "}
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
          <Text dimColor> │ Theme: </Text>
          <Text bold>{THEMES[themeName as ThemeName]?.name ?? "Default"}</Text>
          <Text dimColor> │ Azure: </Text>
          <Text bold>
            {azureOrg && azureProject
              ? `${azureOrg}/${azureProject}`
              : "[not set]"}
          </Text>
          <Text dimColor> │ Jira: </Text>
          <Text bold>
            {jiraSite && jiraProject
              ? `${jiraProject}@${jiraSite}`
              : "[not set]"}
          </Text>
          <Text dimColor> │ Cache: </Text>
          <Text bold>{persistCache ? "on" : "off"}</Text>
          <Text dimColor> ({cacheSizeStr})</Text>
          <Text dimColor> │ e: edit config │ ←/→ switch section</Text>
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
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
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

      {/* Edit Azure org overlay */}
      {showEditAzureOrg && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
              Azure DevOps Organization
            </Text>
            <Box>
              <Text>Org: </Text>
              <TextInput
                placeholder={azureOrg || "type org name..."}
                onSubmit={(val) => {
                  if (val.trim()) {
                    setAzureOrg(val.trim());
                  }
                  setShowEditAzureOrg(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: save │ Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {/* Edit Azure project overlay */}
      {showEditAzureProject && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
              Azure DevOps Project
            </Text>
            <Box>
              <Text>Project: </Text>
              <TextInput
                placeholder={azureProject || "type project name..."}
                onSubmit={(val) => {
                  if (val.trim()) {
                    setAzureProject(val.trim());
                  }
                  setShowEditAzureProject(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: save │ Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {/* Edit Jira site overlay */}
      {showEditJiraSite && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
              Jira Site
            </Text>
            <Box>
              <Text>Site: </Text>
              <TextInput
                placeholder={jiraSite || "yourcompany.atlassian.net"}
                onSubmit={(val) => {
                  if (val.trim()) {
                    setJiraSite(val.trim());
                  }
                  setShowEditJiraSite(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: save │ Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {/* Edit Jira email overlay */}
      {showEditJiraEmail && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
              Jira Email
            </Text>
            <Box>
              <Text>Email: </Text>
              <TextInput
                placeholder={jiraEmail || "user@company.com"}
                onSubmit={(val) => {
                  if (val.trim()) {
                    setJiraEmail(val.trim());
                  }
                  setShowEditJiraEmail(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: save │ Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {/* Edit Jira API token overlay */}
      {showEditJiraToken && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
              Jira API Token
            </Text>
            <Box>
              <Text>Token: </Text>
              <TextInput
                placeholder="paste API token..."
                onSubmit={(val) => {
                  if (val.trim()) {
                    setJiraToken(val.trim());
                  }
                  setShowEditJiraToken(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: save │ Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {/* Edit Jira project overlay */}
      {showEditJiraProject && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={getTheme().ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={getTheme().ui.activeIndicator}>
              Jira Project Key
            </Text>
            <Box>
              <Text>Project: </Text>
              <TextInput
                placeholder={jiraProject || "e.g. UUX"}
                onSubmit={(val) => {
                  if (val.trim()) {
                    setJiraProject(val.trim());
                  }
                  setShowEditJiraProject(false);
                }}
              />
            </Box>
            <Text dimColor>Enter: save │ Esc: cancel</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
