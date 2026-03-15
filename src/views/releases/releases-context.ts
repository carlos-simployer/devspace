import { createContext, useContext } from "react";
import type {
  FocusArea,
  AzureReleaseDefinition,
  AzureRelease,
} from "../../api/types.ts";

export interface ReleasesContextValue {
  focus: FocusArea;
  setFocus: (area: FocusArea) => void;
  sidebarIndex: number;
  setSidebarIndex: (v: number | ((prev: number) => number)) => void;
  listIndex: number;
  setListIndex: (v: number | ((prev: number) => number)) => void;
  definitions: AzureReleaseDefinition[];
  selectedDefinition: AzureReleaseDefinition | null;
  releases: AzureRelease[];
  releasesLoading: boolean;
  fetching: boolean;
  allDefinitions: AzureReleaseDefinition[];
  allDefsLoading: boolean;
}

export const ReleasesContext = createContext<ReleasesContextValue>(null!);

export function useReleasesContext(): ReleasesContextValue {
  const ctx = useContext(ReleasesContext);
  if (ctx === null) {
    throw new Error(
      "useReleasesContext must be used within ReleasesContext.Provider",
    );
  }
  return ctx;
}
