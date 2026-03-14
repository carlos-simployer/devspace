import { useQuery } from "@tanstack/react-query";
import { fetchPipelineRuns } from "../api/azure-client.ts";

export function usePipelineRuns(
  azureOrg: string,
  azureProject: string,
  definitionId: number | null,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["azure-pipeline-runs", azureOrg, azureProject, definitionId],
    queryFn: () => fetchPipelineRuns(azureOrg, azureProject, definitionId!, 20),
    enabled: !!azureOrg && !!azureProject && !!definitionId,
    staleTime: 30_000,
  });

  return {
    runs: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
