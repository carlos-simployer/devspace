import { createContext, useContext } from "react";
import type { ViewId, BaseView } from "./view-config.ts";

export interface ViewContextValue {
  view: ViewId;
  setView: (viewId: ViewId) => void;
  baseView: BaseView;
}

export const ViewContext = createContext<ViewContextValue>({
  view: "prs",
  setView: () => {},
  baseView: "prs",
});

export function useView() {
  return useContext(ViewContext);
}
