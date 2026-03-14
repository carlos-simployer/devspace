import type { JiraIssue, JiraUser } from "./types.ts";

function authHeader(email: string, token: string): string {
  return `Basic ${Buffer.from(email + ":" + token).toString("base64")}`;
}

async function jiraFetch<T>(
  site: string,
  email: string,
  token: string,
  path: string,
): Promise<T> {
  const url = `https://${site}/rest/api/3/${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(email, token),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
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
  fields: string = "summary,status,issuetype,priority,assignee,created,updated,labels",
  maxResults: number = 50,
): Promise<JiraIssue[]> {
  const params = new URLSearchParams({
    jql,
    fields,
    maxResults: String(maxResults),
  });

  const data = await jiraFetch<JiraSearchResponse>(
    site,
    email,
    token,
    `search?${params.toString()}`,
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

export async function getJiraMyself(
  site: string,
  email: string,
  token: string,
): Promise<JiraUser> {
  return jiraFetch<JiraUser>(site, email, token, "myself");
}
