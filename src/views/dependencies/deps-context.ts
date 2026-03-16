import { createContext, useContext } from "react";
import type {
  FocusArea,
  TrackedPackage,
  DependencyResult,
} from "../../api/types.ts";

export interface DepsContextValue {
  focus: FocusArea;
  setFocus: (area: FocusArea) => void;
  packageIndex: number;
  setPackageIndex: (v: number | ((prev: number) => number)) => void;
  resultIndex: number;
  setResultIndex: (v: number | ((prev: number) => number)) => void;
  packageList: TrackedPackage[];
  selectedPackage: TrackedPackage | null;
  selectedResults: DependencyResult[];
  trackedPackages: string[];
}

export const DepsContext = createContext<DepsContextValue>(null!);

export function useDepsContext(): DepsContextValue {
  const ctx = useContext(DepsContext);
  if (ctx === null) {
    throw new Error("useDepsContext must be used within DepsContext.Provider");
  }
  return ctx;
}
