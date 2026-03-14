import { useQuery } from "@tanstack/react-query";
import type { Config } from "../api/types.ts";
import { getJiraIssue } from "../api/jira-client.ts";

export function useJiraIssueDetail(config: Config, issueKey: string | null) {
  const { jiraSite, jiraEmail, jiraToken } = config;
  const enabled = issueKey !== null && !!jiraSite && !!jiraEmail && !!jiraToken;

  const {
    data: issue,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jira-issue", jiraSite, issueKey],
    queryFn: () => getJiraIssue(jiraSite, jiraEmail, jiraToken, issueKey!),
    enabled,
  });

  return {
    issue: issue ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
