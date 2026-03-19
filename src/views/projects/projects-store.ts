import type { ProjectFocus } from "./projects-context.ts";
import { createViewStore } from "../../ui/create-view-store.ts";

export const projectsStore = createViewStore({
  selectedIndex: 0,
  selectedCommandIndex: 0,
  focus: "sidebar" as ProjectFocus,
});
