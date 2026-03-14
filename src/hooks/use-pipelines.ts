import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AzurePipelineDefinition } from "../api/types.ts";
import { fetchPipelineDefinitions } from "../api/azure-client.ts";

export function usePipelines(
  azureOrg: string,
  azureProject: string,
  pinnedIds: number[],
  refreshIntervalSec: number,
) {
  const pinnedKey = pinnedIds.join(",");

  const {
    data: allDefinitions,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["azure-pipelines", azureOrg, azureProject],
    queryFn: () => fetchPipelineDefinitions(azureOrg, azureProject),
    enabled: !!azureOrg && !!azureProject,
    refetchInterval: refreshIntervalSec * 1000,
  });

  const pipelines = useMemo(() => {
    if (!allDefinitions) return [];
    return pinnedIds
      .map((id) => allDefinitions.find((d) => d.id === id))
      .filter((d): d is AzurePipelineDefinition => !!d);
  }, [allDefinitions, pinnedKey]);

  return {
    pipelines,
    allDefinitions: allDefinitions ?? [],
    loading: isLoading,
    fetching: isFetching,
    error: error?.message ?? null,
    refetch,
  };
}

export function useAllPipelineDefinitions(
  azureOrg: string,
  azureProject: string,
) {
  const { data, isLoading } = useQuery({
    queryKey: ["azure-all-definitions", azureOrg, azureProject],
    queryFn: () => fetchPipelineDefinitions(azureOrg, azureProject),
    enabled: !!azureOrg && !!azureProject,
    staleTime: 5 * 60_000,
  });

  return { definitions: data ?? [], loading: isLoading };
}
