import type { FocusArea } from "../../api/types.ts";
import { createViewStore } from "../../ui/create-view-store.ts";

export const slackStore = createViewStore({
  focus: "list" as FocusArea,
  sidebarIndex: 0,
  messageIndex: -1,
});
