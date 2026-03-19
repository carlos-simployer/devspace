import type { FocusArea } from "../../api/types.ts";
import { createViewStore } from "../../ui/create-view-store.ts";

export const depsStore = createViewStore({
  focus: "sidebar" as FocusArea,
  packageIndex: 0,
  resultIndex: 0,
});
