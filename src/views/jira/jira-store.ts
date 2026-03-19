import { createStore } from "zustand/vanilla";
import type { JiraFilterMode } from "../../api/types.ts";
import type { JiraSortField } from "../../utils/jira-status.ts";

export interface JiraStoreState {
  selectedIndex: number;
  setSelectedIndex: (v: number | ((prev: number) => number)) => void;
  filterMode: JiraFilterMode;
  setFilterMode: (v: JiraFilterMode) => void;
  filterAccountIds: Set<string>;
  setFilterAccountIds: (v: Set<string>) => void;
  sortFields: JiraSortField[];
  setSortFields: (v: JiraSortField[]) => void;
  enabledStatuses: Set<string>;
  setEnabledStatuses: (
    v: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  /** Whether enabledStatuses has been initialized from config. */
  _initialized: boolean;
  /** Call once on first mount to set enabledStatuses from config's statusOrder. */
  initialize: (statusOrder: string[]) => void;
}

export const jiraStore = createStore<JiraStoreState>()((set, get) => ({
  selectedIndex: 0,
  setSelectedIndex: (v) =>
    set({
      selectedIndex: typeof v === "function" ? v(get().selectedIndex) : v,
    }),

  filterMode: "mine",
  setFilterMode: (v) => set({ filterMode: v }),

  filterAccountIds: new Set<string>(),
  setFilterAccountIds: (v) => set({ filterAccountIds: v }),

  sortFields: ["updated"] as JiraSortField[],
  setSortFields: (v) => set({ sortFields: v }),

  enabledStatuses: new Set<string>(),
  setEnabledStatuses: (v) =>
    set({
      enabledStatuses: typeof v === "function" ? v(get().enabledStatuses) : v,
    }),

  _initialized: false,
  initialize: (statusOrder) => {
    if (!get()._initialized) {
      set({ enabledStatuses: new Set(statusOrder), _initialized: true });
    }
  },
}));
