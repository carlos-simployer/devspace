import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AzureReleaseDefinition } from "../api/types.ts";
import { fetchReleaseDefinitions, fetchReleases } from "../api/azure-client.ts";

export function useReleaseDefinitions(
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
    queryKey: ["azure-release-defs", azureOrg, azureProject],
    queryFn: () => fetchReleaseDefinitions(azureOrg, azureProject),
    enabled: !!azureOrg && !!azureProject,
    refetchInterval: refreshIntervalSec * 1000,
  });

  const definitions = useMemo(() => {
    if (!allDefinitions) return [];
    return pinnedIds
      .map((id) => allDefinitions.find((d) => d.id === id))
      .filter((d): d is AzureReleaseDefinition => !!d);
  }, [allDefinitions, pinnedKey]);

  return {
    definitions,
    allDefinitions: allDefinitions ?? [],
    loading: isLoading,
    fetching: isFetching,
    error: error?.message ?? null,
    refetch,
  };
}

export function useReleases(
  azureOrg: string,
  azureProject: string,
  definitionId: number | null,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["azure-releases", azureOrg, azureProject, definitionId],
    queryFn: () => fetchReleases(azureOrg, azureProject, definitionId!, 25),
    enabled: !!azureOrg && !!azureProject && !!definitionId,
    staleTime: 30_000,
  });

  return {
    releases: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}

export function useAllReleaseDefinitions(
  azureOrg: string,
  azureProject: string,
) {
  const { data, isLoading } = useQuery({
    queryKey: ["azure-all-release-defs", azureOrg, azureProject],
    queryFn: () => fetchReleaseDefinitions(azureOrg, azureProject),
    enabled: !!azureOrg && !!azureProject,
    staleTime: 5 * 60_000,
  });

  return { definitions: data ?? [], loading: isLoading };
}
