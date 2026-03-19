import type { FilterMode, FocusArea, SortMode } from "../../api/types.ts";
import { createViewStore } from "../../ui/create-view-store.ts";

export const prsStore = createViewStore({
  filterMode: "all" as FilterMode,
  focus: "list" as FocusArea,
  sidebarIndex: 0,
  listIndex: 0,
  sortMode: "repo-updated" as SortMode,
});
