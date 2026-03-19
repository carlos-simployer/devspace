import type { FocusArea } from "../../api/types.ts";
import { createViewStore } from "../../ui/create-view-store.ts";

export const pipelinesStore = createViewStore({
  focus: "sidebar" as FocusArea,
  sidebarIndex: 0,
  listIndex: 0,
});
