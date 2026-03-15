import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { exec } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { REFRESH_PRESETS } from "../../api/types.ts";
import {
  clearQueryCache,
  getQueryCacheSize,
} from "../../utils/query-persister.ts";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import {
  getTheme,
  getThemeNames,
  THEMES,
  type ThemeName,
} from "../../ui/theme.ts";

function formatInterval(seconds: number): string {
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

// -- Section definitions --

type Section = "github" | "azure" | "jira" | "system";
const SECTIONS: Section[] = ["github", "azure", "jira", "system"];

const SECTION_LABELS: Record<Section, string> = {
  github: "GitHub",
  azure: "Azure DevOps",
  jira: "Jira",
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

export function ConfigView() {
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
    setJiraToken,
    setJiraProject,
    setGithubToken,
    setAzureToken,
    setPersistCache,
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
  const jiraToken = config.jiraToken;
  const jiraProject = config.jiraProject;
  const githubToken = config.githubToken;
  const azureToken = config.azureToken;
  const persistCache = config.persistCache;
  const { navigate } = useRouter();
  const [section, setSection] = useState<Section>("github");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);

  const startEditing = (field: string) => {
    setEditingField(field);
    navigate("config/addOrg");
  };
  const stopEditing = () => {
    setEditingField(null);
    navigate("config");
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
            label: `API Token: ${githubToken ? "\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF" : "[not set] (using gh CLI)"}`,
            type: "text" as const,
          },
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
            label: `PAT: ${azureToken ? "\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF" : "[not set] (using az CLI)"}`,
            type: "text" as const,
          },
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
            label: `API Token: ${jiraToken ? "\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF" : "[not set]"}`,
            type: "text" as const,
          },
          {
            key: "jira-project",
            label: `Project: ${jiraProject || "[not set]"}`,
            type: "text" as const,
          },
        ];
      case "system": {
        const cacheSize = getQueryCacheSize();
        const cacheSizeStr =
          cacheSize > 1024 * 1024
            ? `${(cacheSize / 1024 / 1024).toFixed(1)} MB`
            : cacheSize > 1024
              ? `${(cacheSize / 1024).toFixed(0)} KB`
              : cacheSize > 0
                ? `${cacheSize} B`
                : "empty";
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
            label: `Cache: ${persistCache ? "Enabled" : "Disabled"}`,
            type: "action" as const,
          },
          {
            key: "cache-clear",
            label: `Clear cache (${cacheSizeStr})`,
            type: "action" as const,
            color: theme.status.failure,
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

      if (section === "github") {
        if (item.key === "add-org") startEditing("add-org");
        if (item.key === "github-token") startEditing("github-token");
      } else if (section === "azure") {
        startEditing(item.key);
      } else if (section === "jira") {
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
        }
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

      {/* Section content — full width, one section at a time */}
      <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
        <Text dimColor>
          {section === "github" &&
            "GitHub organizations for repo and dependency search."}
          {section === "azure" &&
            "Azure DevOps settings for Pipelines and Releases."}
          {section === "jira" && "Jira Cloud connection settings."}
          {section === "system" &&
            "App settings: refresh interval, theme, cache."}
        </Text>
        <Box height={1} />

        {items.map((item, i) => {
          const isActive = i === selectedIndex;

          // System section: show radio/toggle indicators
          if (section === "system") {
            const isRefresh = item.key.startsWith("refresh-");
            const isTheme = item.key.startsWith("theme-");
            const isOption = isRefresh || isTheme;
            const isSelected = item.options?.[0]?.active ?? false;

            // Group headers
            const prevItem = items[i - 1];
            const showRefreshHeader =
              isRefresh && !prevItem?.key.startsWith("refresh-");
            const showThemeHeader =
              isTheme && !prevItem?.key.startsWith("theme-");
            const showCacheHeader = item.key === "cache-toggle";

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
      </Box>

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
          <Text dimColor> │ Refresh: </Text>
          <Text bold>{formatInterval(refreshInterval)}</Text>
          <Text dimColor> │ Theme: </Text>
          <Text bold>{THEMES[themeName as ThemeName]?.name ?? "Default"}</Text>
          <Text dimColor> │ e: edit config │ Enter: edit │ ←/→ section</Text>
        </Text>
      </Box>

      {/* Edit overlay */}
      {editingField && (
        <Box
          position="absolute"
          marginLeft={Math.floor((width - 50) / 2)}
          marginTop={Math.floor((height - 8) / 2)}
        >
          <Box
            flexDirection="column"
            width={50}
            borderStyle="round"
            borderColor={theme.ui.activeIndicator}
            paddingX={1}
          >
            <Text bold color={theme.ui.activeIndicator}>
              {editingField === "add-org" && "Add Organization"}
              {editingField === "github-token" && "GitHub API Token"}
              {editingField === "azure-org" && "Azure DevOps Organization"}
              {editingField === "azure-project" && "Azure DevOps Project"}
              {editingField === "azure-token" && "Azure DevOps PAT"}
              {editingField === "jira-site" && "Jira Site"}
              {editingField === "jira-email" && "Jira Email"}
              {editingField === "jira-token" && "Jira API Token"}
              {editingField === "jira-project" && "Jira Project Key"}
            </Text>
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
                                    : ""
                }
                onSubmit={(val) => {
                  const v = val.trim();
                  if (v) {
                    if (editingField === "add-org") addOrg(v);
                    if (editingField === "github-token") setGithubToken(v);
                    if (editingField === "azure-org") setAzureOrg(v);
                    if (editingField === "azure-project") setAzureProject(v);
                    if (editingField === "azure-token") setAzureToken(v);
                    if (editingField === "jira-site") setJiraSite(v);
                    if (editingField === "jira-email") setJiraEmail(v);
                    if (editingField === "jira-token") setJiraToken(v);
                    if (editingField === "jira-project") setJiraProject(v);
                  }
                  stopEditing();
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
