import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { exec } from "child_process";
import { join } from "path";
import { REFRESH_PRESETS } from "../../api/types.ts";
import { DEFAULT_CONFIG_DIR, CACHE_DIR } from "../../constants.ts";
import {
  clearQueryCache,
  getQueryCacheSize,
} from "../../utils/query-persister.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { Panel } from "../../ui/panel.tsx";
import { Dialog } from "../../ui/dialog.tsx";
import {
  getTheme,
  getThemeNames,
  THEMES,
  type ThemeName,
} from "../../ui/theme.ts";
import {
  getToken,
  setToken,
  deleteToken,
  type TokenKey,
} from "../../utils/tokens.ts";
import { getAllTabs, getTabs } from "../../ui/tabs.ts";
import { openInBrowser } from "../../utils/browser.ts";
import { readFileSync, unlinkSync } from "fs";

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0) return `${bytes} B`;
  return "empty";
}

function getFileSize(path: string): number {
  try {
    return readFileSync(path).length;
  } catch {
    return 0;
  }
}

function formatInterval(seconds: number): string {
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

// -- Section definitions --

type Section = "github" | "azure" | "jira" | "slack" | "system";
const SECTIONS: Section[] = ["github", "azure", "jira", "slack", "system"];

const SECTION_LABELS: Record<Section, string> = {
  github: "GitHub",
  azure: "Azure DevOps",
  jira: "Jira",
  slack: "Slack",
  system: "System",
};

interface ConfigItem {
  key: string;
  label: string;
  type: "text" | "select" | "action";
  value?: string;
  options?: Array<{ label: string; value: any; active: boolean }>;
  actionLabel?: string;
  color?: string;
}

// Maps editing field names to token keys
const TOKEN_FIELDS: Record<string, TokenKey> = {
  "github-token": "githubToken",
  "azure-token": "azureToken",
  "jira-token": "jiraToken",
  "slack-token": "slackToken",
};

function tokenLabel(tokenKey: TokenKey, fallbackHint?: string): string {
  const val = getToken(tokenKey);
  if (val) return "\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF";
  return fallbackHint ? `[not set] (${fallbackHint})` : "[not set]";
}

export function ConfigMainView() {
  const {
    config,
    addOrg,
    removeOrg,
    setRefreshInterval,
    setThemeName,
    setAzureOrg,
    setAzureProject,
    setJiraSite,
    setJiraEmail,
    setJiraProject,
    setPersistCache,
    setEnabledTabs,
    contentHeight: height,
    width,
    onQuit,
  } = useAppContext();

  const orgs = config.orgs;
  const refreshInterval = config.refreshInterval;
  const themeName = config.theme;
  const azureOrg = config.azureOrg;
  const azureProject = config.azureProject;
  const jiraSite = config.jiraSite;
  const jiraEmail = config.jiraEmail;
  const jiraProject = config.jiraProject;
  const persistCache = config.persistCache;
  const [section, setSection] = useState<Section>("github");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  // Force re-render when tokens change (they live outside React state)
  const [tokenVersion, setTokenVersion] = useState(0);
  const bumpTokens = () => setTokenVersion((v) => v + 1);
  // Suppress unused warning — tokenVersion is used implicitly via getToken calls during render
  void tokenVersion;

  const startEditing = (field: string) => {
    setEditingField(field);
  };
  const stopEditing = () => {
    setEditingField(null);
  };

  const theme = getTheme();

  // Build items for each section
  const getItems = (): ConfigItem[] => {
    switch (section) {
      case "github":
        return [
          ...orgs.map((org) => ({
            key: `org-${org}`,
            label: org,
            type: "text" as const,
          })),
          {
            key: "add-org",
            label: "[+] Add organization",
            type: "action" as const,
            color: theme.list.addAction,
          },
          {
            key: "github-token",
            label: `API Token: ${tokenLabel("githubToken", "using gh CLI")}`,
            type: "text" as const,
          },
          ...(getToken("githubToken")
            ? [
                {
                  key: "github-token-clear",
                  label: "Clear token (use gh CLI)",
                  type: "action" as const,
                  color: theme.status.failure,
                },
              ]
            : []),
        ];
      case "azure":
        return [
          {
            key: "azure-org",
            label: `Organization: ${azureOrg || "[not set]"}`,
            type: "text" as const,
          },
          {
            key: "azure-project",
            label: `Project: ${azureProject || "[not set]"}`,
            type: "text" as const,
          },
          {
            key: "azure-token",
            label: `PAT: ${tokenLabel("azureToken", "using az CLI")}`,
            type: "text" as const,
          },
          ...(getToken("azureToken")
            ? [
                {
                  key: "azure-token-clear",
                  label: "Clear PAT (use az CLI)",
                  type: "action" as const,
                  color: theme.status.failure,
                },
              ]
            : []),
        ];
      case "jira":
        return [
          {
            key: "jira-site",
            label: `Site: ${jiraSite || "[not set]"}`,
            type: "text" as const,
          },
          {
            key: "jira-email",
            label: `Email: ${jiraEmail || "[not set]"}`,
            type: "text" as const,
          },
          {
            key: "jira-token",
            label: `API Token: ${tokenLabel("jiraToken")}`,
            type: "text" as const,
          },
          ...(getToken("jiraToken")
            ? [
                {
                  key: "jira-token-clear",
                  label: "Clear token",
                  type: "action" as const,
                  color: theme.status.failure,
                },
              ]
            : []),
          {
            key: "jira-project",
            label: `Project: ${jiraProject || "[not set]"}`,
            type: "text" as const,
          },
        ];
      case "slack":
        return [
          {
            key: "slack-token",
            label: `Token: ${tokenLabel("slackToken")}`,
            type: "text" as const,
          },
          ...(getToken("slackToken")
            ? [
                {
                  key: "slack-token-clear",
                  label: "Clear token",
                  type: "action" as const,
                  color: theme.status.failure,
                },
              ]
            : []),
        ];
      case "system": {
        const queryCacheStr = formatSize(getQueryCacheSize());
        const depCacheStr = formatSize(
          getFileSize(join(CACHE_DIR, "dep-cache.json")),
        );
        return [
          // Refresh interval presets
          ...REFRESH_PRESETS.map((s) => ({
            key: `refresh-${s}`,
            label: `Refresh: ${formatInterval(s)}`,
            type: "select" as const,
            options: [
              {
                label: formatInterval(s),
                value: s,
                active: s === refreshInterval,
              },
            ],
          })),
          // Theme
          ...getThemeNames().map((name) => ({
            key: `theme-${name}`,
            label: `Theme: ${THEMES[name].name}`,
            type: "select" as const,
            options: [
              {
                label: THEMES[name].name,
                value: name,
                active: name === themeName,
              },
            ],
          })),
          // Cache
          {
            key: "cache-toggle",
            label: `Persist cache: ${persistCache ? "Enabled" : "Disabled"}`,
            type: "action" as const,
          },
          {
            key: "cache-clear",
            label: `Clear query cache (${queryCacheStr})`,
            type: "action" as const,
            color: theme.status.failure,
          },
          {
            key: "dep-cache-clear",
            label: `Clear dependency cache (${depCacheStr})`,
            type: "action" as const,
            color: theme.status.failure,
          },
          // Views — toggle and reorder tabs
          ...getAllTabs().map((tab) => {
            const active = getTabs().some((t) => t.route === tab.route);
            return {
              key: `view-${tab.route}`,
              label: `${tab.label}`,
              type: "select" as const,
              options: [{ label: tab.label, value: tab.route, active }],
            };
          }),
          {
            key: "views-reset",
            label: "Reset to default order",
            type: "action" as const,
            color: theme.status.pending,
          },
          // Storage paths — press o to open in Finder
          {
            key: "config-dir",
            label: `Config: ${DEFAULT_CONFIG_DIR}`,
            type: "action" as const,
          },
          {
            key: "cache-dir",
            label: `Cache: ${CACHE_DIR}`,
            type: "action" as const,
          },
        ];
      }
    }
  };

  const items = getItems();

  // Handle escape in edit overlays
  useInput(
    (_input, key) => {
      if (key.escape) stopEditing();
    },
    { isActive: !!editingField },
  );

  useRouteShortcuts({
    quit: onQuit,
    add: () => {
      if (section === "github") startEditing("add-org");
    },
    remove: () => {
      if (section === "github" && selectedIndex < orgs.length) {
        const org = orgs[selectedIndex];
        if (org) {
          removeOrg(org);
          setSelectedIndex((i) => Math.max(0, i - 1));
        }
      }
    },
    select: () => {
      const item = items[selectedIndex];
      if (!item) return;

      // Token clear actions
      if (item.key.endsWith("-token-clear")) {
        const tokenField = item.key.replace("-clear", "");
        const tokenKey = TOKEN_FIELDS[tokenField];
        if (tokenKey) {
          deleteToken(tokenKey);
          bumpTokens();
        }
        return;
      }

      if (section === "github") {
        if (item.key === "add-org") startEditing("add-org");
        if (item.key === "github-token") startEditing("github-token");
      } else if (section === "azure") {
        startEditing(item.key);
      } else if (section === "jira") {
        startEditing(item.key);
      } else if (section === "slack") {
        startEditing(item.key);
      } else if (section === "system") {
        if (item.key.startsWith("refresh-")) {
          const val = parseInt(item.key.split("-")[1]!, 10);
          setRefreshInterval(val);
        } else if (item.key.startsWith("theme-")) {
          const name = item.key.replace("theme-", "");
          setThemeName(name);
        } else if (item.key === "cache-toggle") {
          setPersistCache(!persistCache);
        } else if (item.key === "cache-clear") {
          clearQueryCache();
        } else if (item.key === "dep-cache-clear") {
          try {
            unlinkSync(join(CACHE_DIR, "dep-cache.json"));
          } catch {
            // ignore
          }
        } else if (item.key === "config-dir") {
          openInBrowser(DEFAULT_CONFIG_DIR);
        } else if (item.key === "cache-dir") {
          openInBrowser(CACHE_DIR);
        } else if (item.key.startsWith("view-")) {
          // Toggle view enabled/disabled
          const route = item.key.replace("view-", "");
          const current =
            config.enabledTabs.length > 0
              ? config.enabledTabs
              : getAllTabs().map((t) => t.route);
          const isEnabled = current.includes(route);
          if (isEnabled && current.length > 1) {
            setEnabledTabs(current.filter((r) => r !== route));
          } else if (!isEnabled) {
            setEnabledTabs([...current, route]);
          }
        } else if (item.key === "views-reset") {
          setEnabledTabs([]);
        }
      }
    },
    open: () => {
      if (section !== "system") return;
      const item = items[selectedIndex];
      if (!item) return;
      if (item.key === "config-dir") openInBrowser(DEFAULT_CONFIG_DIR);
      if (item.key === "cache-dir") openInBrowser(CACHE_DIR);
    },
    editConfig: () => {
      const configPath = join(DEFAULT_CONFIG_DIR, "config.json");
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
        return SECTIONS[(idx - 1 + SECTIONS.length) % SECTIONS.length]!;
      });
      setSelectedIndex(0);
    },
    right: () => {
      setSection((s) => {
        const idx = SECTIONS.indexOf(s);
        return SECTIONS[(idx + 1) % SECTIONS.length]!;
      });
      setSelectedIndex(0);
    },
  });

  // -- Rendering --

  const sectionTabBar = (
    <Box paddingX={1}>
      {SECTIONS.map((s) => (
        <Box key={s} marginRight={2}>
          <Text bold={s === section} inverse={s === section}>
            {" "}
            {SECTION_LABELS[s]}{" "}
          </Text>
        </Box>
      ))}
      <Text dimColor> {"\u2190/\u2192"} switch section</Text>
    </Box>
  );

  return (
    <Box height={height} width={width} flexDirection="column">
      {/* Section tab bar */}
      {sectionTabBar}
      <Box
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
      />

      {/* Section content -- full width, one section at a time */}
      <Panel title={SECTION_LABELS[section]} focused={true} width={width}>
        <Text dimColor>
          {section === "github" &&
            "GitHub organizations for repo and dependency search."}
          {section === "azure" &&
            "Azure DevOps settings for Pipelines and Releases."}
          {section === "jira" && "Jira Cloud connection settings."}
          {section === "slack" &&
            "Slack API token for reading and writing messages."}
          {section === "system" &&
            "App settings: refresh interval, theme, cache, views, storage."}
        </Text>
        <Box height={1} />

        {items.map((item, i) => {
          const isActive = i === selectedIndex;

          // System section: show radio/toggle indicators
          if (section === "system") {
            const isRefresh = item.key.startsWith("refresh-");
            const isTheme = item.key.startsWith("theme-");
            const isView = item.key.startsWith("view-");
            const isOption = isRefresh || isTheme || isView;
            const isSelected = item.options?.[0]?.active ?? false;

            // Group headers
            const prevItem = items[i - 1];
            const showRefreshHeader =
              isRefresh && !prevItem?.key.startsWith("refresh-");
            const showThemeHeader =
              isTheme && !prevItem?.key.startsWith("theme-");
            const showCacheHeader = item.key === "cache-toggle";
            const showViewsHeader =
              isView && !prevItem?.key.startsWith("view-");
            const showStorageHeader = item.key === "config-dir";

            return (
              <React.Fragment key={item.key}>
                {showRefreshHeader && (
                  <Text bold color={theme.ui.heading}>
                    Refresh Interval
                  </Text>
                )}
                {showThemeHeader && (
                  <>
                    <Box height={1} />
                    <Text bold color={theme.ui.heading}>
                      Theme
                    </Text>
                  </>
                )}
                {showCacheHeader && (
                  <>
                    <Box height={1} />
                    <Text bold color={theme.ui.heading}>
                      Cache
                    </Text>
                  </>
                )}
                {showViewsHeader && (
                  <>
                    <Box height={1} />
                    <Text bold color={theme.ui.heading}>
                      Views
                    </Text>
                  </>
                )}
                {showStorageHeader && (
                  <>
                    <Box height={1} />
                    <Box>
                      <Text bold color={theme.ui.heading}>
                        Storage
                      </Text>
                      <Text dimColor> (o: open in Finder)</Text>
                    </Box>
                  </>
                )}
                <Box>
                  <Text
                    inverse={isActive}
                    bold={isActive || isSelected}
                    color={
                      isActive
                        ? undefined
                        : isSelected
                          ? theme.ui.activeIndicator
                          : item.color
                    }
                  >
                    {isActive ? "> " : "  "}
                    {isOption ? (isSelected ? "\u25CF " : "\u25CB ") : ""}
                    {isRefresh
                      ? formatInterval(parseInt(item.key.split("-")[1]!, 10))
                      : isTheme
                        ? (THEMES[item.key.replace("theme-", "") as ThemeName]
                            ?.name ?? item.label)
                        : item.label}
                  </Text>
                  {isTheme && !isActive && (
                    <Text>
                      {"  "}
                      <Text
                        color={
                          THEMES[item.key.replace("theme-", "") as ThemeName]
                            ?.status.success
                        }
                      >
                        {"\u25CF"}
                      </Text>
                      <Text
                        color={
                          THEMES[item.key.replace("theme-", "") as ThemeName]
                            ?.status.failure
                        }
                      >
                        {"\u25CF"}
                      </Text>
                      <Text
                        color={
                          THEMES[item.key.replace("theme-", "") as ThemeName]
                            ?.status.pending
                        }
                      >
                        {"\u25CF"}
                      </Text>
                      <Text
                        color={
                          THEMES[item.key.replace("theme-", "") as ThemeName]
                            ?.ui.border
                        }
                      >
                        {"\u25CF"}
                      </Text>
                    </Text>
                  )}
                </Box>
              </React.Fragment>
            );
          }

          // GitHub/Azure/Jira: simple list items
          return (
            <Box key={item.key}>
              <Text
                inverse={isActive}
                bold={isActive}
                color={isActive ? undefined : item.color}
              >
                {isActive ? "> " : "  "}
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Panel>

      {/* Status bar */}
      <Box
        width={width}
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
          <Text dimColor> {"\u2502"} Refresh: </Text>
          <Text bold>{formatInterval(refreshInterval)}</Text>
          <Text dimColor> {"\u2502"} Theme: </Text>
          <Text bold>{THEMES[themeName as ThemeName]?.name ?? "Default"}</Text>
          <Text dimColor>
            {" "}
            {"\u2502"} e: edit config {"\u2502"} Enter: edit {"\u2502"}{" "}
            {"\u2190/\u2192"} section
          </Text>
        </Text>
      </Box>

      {/* Edit overlay */}
      {editingField && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Dialog
            title={
              editingField === "add-org"
                ? "Add Organization"
                : editingField === "github-token"
                  ? "GitHub API Token"
                  : editingField === "azure-org"
                    ? "Azure DevOps Organization"
                    : editingField === "azure-project"
                      ? "Azure DevOps Project"
                      : editingField === "azure-token"
                        ? "Azure DevOps PAT"
                        : editingField === "jira-site"
                          ? "Jira Site"
                          : editingField === "jira-email"
                            ? "Jira Email"
                            : editingField === "jira-token"
                              ? "Jira API Token"
                              : editingField === "jira-project"
                                ? "Jira Project Key"
                                : editingField === "slack-token"
                                  ? "Slack Token"
                                  : "Edit"
            }
            width={50}
            height={5}
            footer={<Text dimColor>Enter: save {"\u2502"} Esc: cancel</Text>}
          >
            <Box>
              <Text>
                {editingField === "add-org" && "Name: "}
                {editingField === "github-token" && "Token: "}
                {editingField === "azure-org" && "Org: "}
                {editingField === "azure-project" && "Project: "}
                {editingField === "azure-token" && "PAT: "}
                {editingField === "jira-site" && "Site: "}
                {editingField === "jira-email" && "Email: "}
                {editingField === "jira-token" && "Token: "}
                {editingField === "jira-project" && "Project: "}
                {editingField === "slack-token" && "Token: "}
              </Text>
              <TextInput
                placeholder={
                  editingField === "add-org"
                    ? "type org name..."
                    : editingField === "github-token"
                      ? "paste GitHub PAT (leave empty to use gh CLI)..."
                      : editingField === "azure-org"
                        ? azureOrg || "type org name..."
                        : editingField === "azure-project"
                          ? azureProject || "type project name..."
                          : editingField === "azure-token"
                            ? "paste Azure DevOps PAT (leave empty to use az CLI)..."
                            : editingField === "jira-site"
                              ? jiraSite || "yourcompany.atlassian.net"
                              : editingField === "jira-email"
                                ? jiraEmail || "user@company.com"
                                : editingField === "jira-token"
                                  ? "paste API token..."
                                  : editingField === "jira-project"
                                    ? jiraProject || "e.g. UUX"
                                    : editingField === "slack-token"
                                      ? "paste xoxp-... or xoxb-... token"
                                      : ""
                }
                onSubmit={(val) => {
                  const v = val.trim();
                  if (v) {
                    // Token fields go to tokens.json
                    const tokenKey = TOKEN_FIELDS[editingField!];
                    if (tokenKey) {
                      setToken(tokenKey, v);
                      bumpTokens();
                    } else if (editingField === "add-org") {
                      addOrg(v);
                    } else if (editingField === "azure-org") {
                      setAzureOrg(v);
                    } else if (editingField === "azure-project") {
                      setAzureProject(v);
                    } else if (editingField === "jira-site") {
                      setJiraSite(v);
                    } else if (editingField === "jira-email") {
                      setJiraEmail(v);
                    } else if (editingField === "jira-project") {
                      setJiraProject(v);
                    }
                  }
                  stopEditing();
                }}
              />
            </Box>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}
