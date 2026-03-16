import { createContext, useContext } from "react";
import type {
  FocusArea,
  AzurePipelineDefinition,
  AzureBuildRun,
} from "../../api/types.ts";

export interface PipelinesContextValue {
  focus: FocusArea;
  setFocus: (area: FocusArea) => void;
  sidebarIndex: number;
  setSidebarIndex: (v: number | ((prev: number) => number)) => void;
  listIndex: number;
  setListIndex: (v: number | ((prev: number) => number)) => void;
  pipelines: AzurePipelineDefinition[];
  selectedPipeline: AzurePipelineDefinition | null;
  loading: boolean;
  fetching: boolean;
  refetch: () => void;
  definitions: AzurePipelineDefinition[];
  defsLoading: boolean;
  runs: AzureBuildRun[];
  runsLoading: boolean;
  runsError: string | null;
}

export const PipelinesContext = createContext<PipelinesContextValue>(null!);

export function usePipelinesContext(): PipelinesContextValue {
  const ctx = useContext(PipelinesContext);
  if (ctx === null) {
    throw new Error(
      "usePipelinesContext must be used within PipelinesContext.Provider",
    );
  }
  return ctx;
}
