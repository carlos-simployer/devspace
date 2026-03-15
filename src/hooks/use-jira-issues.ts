import { useQuery } from "@tanstack/react-query";
import type { Config, JiraFilterMode, JiraIssue } from "../api/types.ts";
import { searchJiraIssues } from "../api/jira-client.ts";

function buildAssigneeClause(accountIds: Set<string>): string {
  if (accountIds.size === 1) {
    return `assignee = "${[...accountIds][0]}"`;
  }
  const ids = [...accountIds].map((id) => `"${id}"`).join(", ");
  return `assignee IN (${ids})`;
}

function buildJql(
  project: string,
  filterMode: JiraFilterMode,
  filterAccountIds?: Set<string>,
): string {
  const base = `project = ${project}`;

  switch (filterMode) {
    case "mine":
      return `${base} AND assignee = currentUser() AND statusCategory != Done ORDER BY status ASC, updated DESC`;
    case "team":
      return `${base} AND statusCategory != Done ORDER BY status ASC, updated DESC`;
    case "person": {
      if (!filterAccountIds || filterAccountIds.size === 0) {
        return `${base} AND statusCategory != Done ORDER BY status ASC, updated DESC`;
      }
      return `${base} AND ${buildAssigneeClause(filterAccountIds)} AND statusCategory != Done ORDER BY status ASC, updated DESC`;
    }
  }
}

function buildDoneJql(
  project: string,
  filterMode: JiraFilterMode,
  filterAccountIds?: Set<string>,
): string {
  const base = `project = ${project} AND status = Done`;
  switch (filterMode) {
    case "mine":
      return `${base} AND assignee = currentUser() ORDER BY updated DESC`;
    case "person": {
      if (!filterAccountIds || filterAccountIds.size === 0) {
        return `${base} ORDER BY updated DESC`;
      }
      return `${base} AND ${buildAssigneeClause(filterAccountIds)} ORDER BY updated DESC`;
    }
    case "team":
      return `${base} ORDER BY updated DESC`;
  }
}

export function useJiraIssues(
  config: Config,
  filterMode: JiraFilterMode,
  filterAccountIds?: Set<string>,
) {
  const { jiraSite, jiraEmail, jiraToken, jiraProject } = config;
  const enabled = !!jiraSite && !!jiraEmail && !!jiraToken && !!jiraProject;

  // Stable key for the Set
  const idsKey = filterAccountIds ? [...filterAccountIds].sort().join(",") : "";

  const {
    data: issues,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jira-issues", jiraSite, jiraProject, filterMode, idsKey],
    queryFn: async (): Promise<JiraIssue[]> => {
      const jql = buildJql(jiraProject, filterMode, filterAccountIds);
      const doneJql = buildDoneJql(jiraProject, filterMode, filterAccountIds);

      const [openIssues, doneIssues] = await Promise.all([
        searchJiraIssues(jiraSite, jiraEmail, jiraToken, jql),
        searchJiraIssues(
          jiraSite,
          jiraEmail,
          jiraToken,
          doneJql,
          undefined,
          20,
        ),
      ]);

      return [...openIssues, ...doneIssues];
    },
    enabled,
    refetchInterval: config.refreshInterval * 1000,
  });

  return {
    issues: issues ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
