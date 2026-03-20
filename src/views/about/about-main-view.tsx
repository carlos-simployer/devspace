import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { platform, release, arch, cpus, totalmem, freemem } from "os";
import { useAppContext } from "../../app-context.ts";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { Panel } from "../../ui/panel.tsx";
import { getTheme } from "../../ui/theme.ts";
import { APP_NAME, DEFAULT_CONFIG_DIR, CACHE_DIR } from "../../constants.ts";
import { getToken } from "../../utils/tokens.ts";

// Read version from package.json at build time
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const packageJson = require("../../../package.json");

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = getTheme();
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={theme.ui.heading}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = getTheme();
  return (
    <Box>
      <Text dimColor>
        {"  "}
        {label.padEnd(22)}
      </Text>
      <Text color={value === "configured" ? theme.status.success : undefined}>
        {value}
      </Text>
    </Box>
  );
}

function StatusRow({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) {
  const theme = getTheme();
  return (
    <Box>
      <Text dimColor>
        {"  "}
        {label.padEnd(22)}
      </Text>
      <Text color={configured ? theme.status.success : theme.status.muted}>
        {configured ? "\u25CF configured" : "\u25CB not configured"}
      </Text>
    </Box>
  );
}

export function AboutMainView() {
  const { config, contentHeight: height, width, onQuit } = useAppContext();
  const theme = getTheme();

  const [uptick, setUptick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUptick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);
  void uptick;

  useRouteShortcuts({ quit: onQuit });

  // System info
  const cpuModel = cpus()[0]?.model ?? "unknown";
  const cpuCount = cpus().length;
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;

  // Integration status
  const hasGithub = config.orgs.length > 0 && config.repos.length > 0;
  const hasAzure = !!config.azureOrg && !!config.azureProject;
  const hasJira =
    !!config.jiraSite && !!config.jiraEmail && !!getToken("jiraToken");
  const hasSlack = !!getToken("slackToken");
  const hasProjects = config.localProjects.length > 0;

  // Stats
  const totalCommands = config.localProjects.reduce(
    (sum, p) => sum + p.commands.length,
    0,
  );

  return (
    <Box height={height} width={width} flexDirection="column">
      <Panel
        title={`${APP_NAME} v${packageJson.version}`}
        focused={true}
        width={width}
        height={height}
      >
        <Box flexDirection="row" width={width - 4}>
          {/* Left column */}
          <Box flexDirection="column" width={Math.floor((width - 4) / 2)}>
            <Section title="Integrations">
              <StatusRow label="GitHub" configured={hasGithub} />
              <StatusRow label="Azure DevOps" configured={hasAzure} />
              <StatusRow label="Jira" configured={hasJira} />
              <StatusRow label="Slack" configured={hasSlack} />
              <StatusRow label="Local Projects" configured={hasProjects} />
            </Section>

            <Section title="Configuration">
              <Row label="Active org" value={config.activeOrg || "(none)"} />
              <Row label="Pinned repos" value={String(config.repos.length)} />
              <Row
                label="Tracked packages"
                value={String(config.trackedPackages.length)}
              />
              <Row
                label="Pinned pipelines"
                value={String(config.pinnedPipelines.length)}
              />
              <Row
                label="Release definitions"
                value={String(config.pinnedReleaseDefinitions.length)}
              />
              <Row
                label="Local projects"
                value={`${config.localProjects.length} (${totalCommands} commands)`}
              />
              <Row
                label="Slack channels"
                value={String(config.slackChannels.length)}
              />
              <Row
                label="Refresh interval"
                value={`${config.refreshInterval}s`}
              />
              <Row label="Theme" value={config.theme} />
              <Row
                label="Cache persistence"
                value={config.persistCache ? "on" : "off"}
              />
            </Section>
          </Box>

          {/* Right column */}
          <Box flexDirection="column">
            <Section title="System">
              <Row
                label="OS"
                value={`${platform()} ${release()} (${arch()})`}
              />
              <Row label="Node.js" value={process.version} />
              <Row label="CPU" value={`${cpuModel} (${cpuCount} cores)`} />
              <Row
                label="Memory"
                value={`${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${formatBytes(freeMem)} free)`}
              />
              <Row label="Terminal" value={`${width} x ${height}`} />
            </Section>

            <Section title="Paths">
              <Row label="Config" value={DEFAULT_CONFIG_DIR} />
              <Row label="Cache" value={CACHE_DIR} />
            </Section>

            {hasJira && (
              <Section title="Jira">
                <Row label="Site" value={config.jiraSite} />
                <Row label="Project" value={config.jiraProject} />
                <Row label="Email" value={config.jiraEmail} />
              </Section>
            )}

            {hasAzure && (
              <Section title="Azure DevOps">
                <Row label="Organization" value={config.azureOrg} />
                <Row label="Project" value={config.azureProject} />
              </Section>
            )}
          </Box>
        </Box>
      </Panel>
    </Box>
  );
}
