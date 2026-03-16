import type { JiraIssue, JiraUser, JiraTransition } from "./types.ts";
import * as logger from "../utils/logger.ts";

function authHeader(email: string, token: string): string {
  return `Basic ${Buffer.from(email + ":" + token).toString("base64")}`;
}

function cleanSiteUrl(site: string): string {
  return site.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function jiraFetch<T>(
  site: string,
  email: string,
  token: string,
  path: string,
  options?: { method?: string; body?: any },
): Promise<T> {
  const url = `https://${cleanSiteUrl(site)}/rest/api/3/${path}`;

  const res = await fetch(url, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: authHeader(email, token),
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!res.ok) {
    logger.error(
      "jira",
      `API error: ${res.status} ${res.statusText} for ${path}`,
    );
    throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

export async function searchJiraIssues(
  site: string,
  email: string,
  token: string,
  jql: string,
  fields: string[] = [
    "summary",
    "status",
    "issuetype",
    "priority",
    "assignee",
    "created",
    "updated",
    "labels",
  ],
  maxResults: number = 50,
): Promise<JiraIssue[]> {
  // Jira Cloud deprecated /search — use /search/jql (since May 2025)
  const data = await jiraFetch<JiraSearchResponse>(
    site,
    email,
    token,
    "search/jql",
    {
      method: "POST",
      body: { jql, fields, maxResults },
    },
  );

  return data.issues;
}

export async function getJiraIssue(
  site: string,
  email: string,
  token: string,
  issueKey: string,
): Promise<JiraIssue> {
  const fields = [
    "summary",
    "description",
    "status",
    "issuetype",
    "priority",
    "assignee",
    "reporter",
    "created",
    "updated",
    "labels",
    "comment",
    "subtasks",
    "parent",
    "fixVersions",
  ].join(",");

  return jiraFetch<JiraIssue>(
    site,
    email,
    token,
    `issue/${issueKey}?fields=${fields}`,
  );
}

export async function getJiraTransitions(
  site: string,
  email: string,
  token: string,
  issueKey: string,
): Promise<JiraTransition[]> {
  const data = await jiraFetch<{ transitions: JiraTransition[] }>(
    site,
    email,
    token,
    `issue/${issueKey}/transitions`,
  );
  return data.transitions;
}

export async function transitionJiraIssue(
  site: string,
  email: string,
  token: string,
  issueKey: string,
  transitionId: string,
): Promise<void> {
  const url = `https://${cleanSiteUrl(site)}/rest/api/3/issue/${issueKey}/transitions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(email, token),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transition: { id: transitionId } }),
  });

  if (!res.ok) {
    logger.error(
      "jira",
      `Transition error: ${res.status} ${res.statusText} for ${issueKey}`,
    );
    throw new Error(`Jira transition error: ${res.status} ${res.statusText}`);
  }
}

export async function getJiraMyself(
  site: string,
  email: string,
  token: string,
): Promise<JiraUser> {
  return jiraFetch<JiraUser>(site, email, token, "myself");
}
