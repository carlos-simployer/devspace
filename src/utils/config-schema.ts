import { z } from "zod";

// --- Project command schema ---

export const projectCommandSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  cwd: z.string().optional(),
  url: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

// --- Local project schema ---

export const localProjectSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  commands: z.array(projectCommandSchema).min(1),
});

// --- Legacy project (v1: single command) ---

export const localProjectV1Schema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  command: z.string().min(1),
  dependencies: z.array(z.string()).optional().default([]),
  url: z.string().optional(),
});

// --- Full config schema ---

export const configSchema = z.object({
  version: z.literal(2).default(2),
  orgs: z.array(z.string()).default([]),
  activeOrg: z.string().default(""),
  repos: z.array(z.string()).default([]),
  lastViewed: z.record(z.string(), z.number()).default({}),
  trackedPackages: z.array(z.string()).default([]),
  refreshInterval: z.number().positive().default(60),
  theme: z.string().default("default"),
  azureOrg: z.string().default(""),
  azureProject: z.string().default(""),
  pinnedPipelines: z.array(z.number()).default([]),
  pinnedReleaseDefinitions: z.array(z.number()).default([]),
  localProjects: z.array(localProjectSchema).default([]),
  persistCache: z.boolean().default(true),
  jiraSite: z.string().default(""),
  jiraEmail: z.string().default(""),
  jiraProject: z.string().default(""),
  jiraStatusOrder: z
    .array(z.string())
    .default([
      "In Progress",
      "Blocked",
      "In Review",
      "Ready for Test",
      "To Do",
      "Done",
    ]),
  jiraAccountId: z.string().default(""),
  slackChannels: z.array(z.string()).default([]),
  enabledTabs: z.array(z.string()).default([]),
});

export type ValidatedConfig = z.infer<typeof configSchema>;
