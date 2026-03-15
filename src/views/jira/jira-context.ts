import { createContext, useContext } from "react";
import type { JiraIssue, JiraFilterMode } from "../../api/types.ts";
import type { JiraSortField } from "../../utils/jira-status.ts";

export interface JiraContextValue {
  selectedIndex: number;
  setSelectedIndex: (v: number | ((prev: number) => number)) => void;
  selectedIssue: JiraIssue | null;
  filteredIssues: JiraIssue[];
  filterMode: JiraFilterMode;
  setFilterMode: (mode: JiraFilterMode) => void;
  filterAccountIds: Set<string>;
  setFilterAccountIds: (ids: Set<string>) => void;
  enabledStatuses: Set<string>;
  setEnabledStatuses: (
    s: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  searchText: string;
  searchMode: boolean;
  setSearchMode: (v: boolean) => void;
  setSearchText: (v: string | ((prev: string) => string)) => void;
  sortFields: JiraSortField[];
  setSortFields: (fields: JiraSortField[]) => void;
  statusOrder: string[];
  allStatusesEnabled: boolean;
  issues: JiraIssue[];
  loading: boolean;
  fetching: boolean;
  error: string | null;
  refetch: () => void;
  detailIssue: JiraIssue | null;
  detailLoading: boolean;
  detailError: string | null;
}

export const JiraContext = createContext<JiraContextValue>(null!);

export function useJiraContext(): JiraContextValue {
  const ctx = useContext(JiraContext);
  if (ctx === null) {
    throw new Error("useJiraContext must be used within JiraContext.Provider");
  }
  return ctx;
}
