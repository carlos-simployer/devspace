import { useQuery } from "@tanstack/react-query";
import type { Config, JiraFilterMode, JiraIssue } from "../api/types.ts";
import { searchJiraIssues } from "../api/jira-client.ts";

function buildJql(
  project: string,
  filterMode: JiraFilterMode,
  jiraAccountId?: string,
  filterAccountId?: string,
): string {
  const base = `project = ${project}`;

  switch (filterMode) {
    case "mine":
      return `${base} AND assignee = currentUser() AND statusCategory != Done ORDER BY status ASC, updated DESC`;
    case "team":
      return `${base} AND statusCategory != Done ORDER BY status ASC, updated DESC`;
    case "person":
      return `${base} AND assignee = "${filterAccountId}" AND statusCategory != Done ORDER BY status ASC, updated DESC`;
  }
}

function buildDoneJql(
  project: string,
  filterMode: JiraFilterMode,
  filterAccountId?: string,
): string {
  const base = `project = ${project} AND status = Done`;
  switch (filterMode) {
    case "mine":
      return `${base} AND assignee = currentUser() ORDER BY updated DESC`;
    case "person":
      return `${base} AND assignee = "${filterAccountId}" ORDER BY updated DESC`;
    case "team":
      return `${base} ORDER BY updated DESC`;
  }
}

export function useJiraIssues(
  config: Config,
  filterMode: JiraFilterMode,
  filterAccountId?: string,
) {
  const { jiraSite, jiraEmail, jiraToken, jiraProject, jiraAccountId } = config;
  const enabled = !!jiraSite && !!jiraEmail && !!jiraToken && !!jiraProject;

  const {
    data: issues,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "jira-issues",
      jiraSite,
      jiraProject,
      filterMode,
      filterAccountId,
    ],
    queryFn: async (): Promise<JiraIssue[]> => {
      const jql = buildJql(
        jiraProject,
        filterMode,
        jiraAccountId,
        filterAccountId,
      );
      const doneJql = buildDoneJql(jiraProject, filterMode, filterAccountId);

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
