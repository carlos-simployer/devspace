import type {
  AzurePipelineDefinition,
  AzureBuildRun,
  AzureReleaseDefinition,
  AzureRelease,
} from "./types.ts";
import { getAzureToken } from "./azure-auth.ts";

async function azureFetch<T>(
  baseHost: string,
  org: string,
  project: string,
  path: string,
  token: string,
): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://${baseHost}/${org}/${project}/_apis/${path}${separator}api-version=7.1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Azure DevOps API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

interface AzureListResponse<T> {
  count: number;
  value: T[];
}

export async function fetchPipelineDefinitions(
  org: string,
  project: string,
): Promise<AzurePipelineDefinition[]> {
  const token = await getAzureToken();
  if (!token) throw new Error("No Azure DevOps token available");

  const data = await azureFetch<AzureListResponse<any>>(
    "dev.azure.com",
    org,
    project,
    "build/definitions?includeLatestBuilds=true",
    token,
  );

  return data.value.map((d: any) => ({
    id: d.id,
    name: d.name,
    path: d.path ?? "\\",
    latestBuild: d.latestBuild ? mapBuildRun(d.latestBuild) : null,
  }));
}

export async function fetchPipelineRuns(
  org: string,
  project: string,
  definitionId: number,
  top: number = 20,
): Promise<AzureBuildRun[]> {
  const token = await getAzureToken();
  if (!token) throw new Error("No Azure DevOps token available");

  const data = await azureFetch<AzureListResponse<any>>(
    "dev.azure.com",
    org,
    project,
    `build/builds?definitions=${definitionId}&$top=${top}`,
    token,
  );

  return data.value.map(mapBuildRun);
}

export async function fetchReleaseDefinitions(
  org: string,
  project: string,
): Promise<AzureReleaseDefinition[]> {
  const token = await getAzureToken();
  if (!token) throw new Error("No Azure DevOps token available");

  const data = await azureFetch<AzureListResponse<any>>(
    "vsrm.dev.azure.com",
    org,
    project,
    "release/definitions",
    token,
  );

  return data.value.map((d: any) => ({
    id: d.id,
    name: d.name,
    environments: (d.environments ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
    })),
  }));
}

export async function fetchReleases(
  org: string,
  project: string,
  definitionId: number,
  top: number = 25,
): Promise<AzureRelease[]> {
  const token = await getAzureToken();
  if (!token) throw new Error("No Azure DevOps token available");

  const data = await azureFetch<AzureListResponse<any>>(
    "vsrm.dev.azure.com",
    org,
    project,
    `release/releases?definitionId=${definitionId}&$top=${top}&$expand=environments,artifacts`,
    token,
  );

  return data.value.map((r: any) => ({
    id: r.id,
    name: r.name,
    createdOn: r.createdOn,
    description: r.description ?? "",
    environments: (r.environments ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status ?? "notStarted",
    })),
    artifacts: (r.artifacts ?? []).map((a: any) => ({
      type: a.type,
      alias: a.alias,
      definitionReference: {
        version: a.definitionReference?.version
          ? {
              id: a.definitionReference.version.id,
              name: a.definitionReference.version.name,
            }
          : undefined,
        branch: a.definitionReference?.branch
          ? {
              id: a.definitionReference.branch.id,
              name: a.definitionReference.branch.name,
            }
          : undefined,
      },
    })),
  }));
}

function mapBuildRun(b: any): AzureBuildRun {
  return {
    id: b.id,
    buildNumber: b.buildNumber ?? "",
    status: b.status ?? "none",
    result: b.result ?? null,
    sourceBranch: b.sourceBranch ?? "",
    sourceVersion: b.sourceVersion ?? "",
    reason: b.reason ?? "",
    startTime: b.startTime ?? null,
    finishTime: b.finishTime ?? null,
    queueTime: b.queueTime ?? "",
    triggerInfo: b.triggerInfo ?? undefined,
    definition: {
      id: b.definition?.id ?? 0,
      name: b.definition?.name ?? "",
    },
    requestedFor: b.requestedFor
      ? { displayName: b.requestedFor.displayName ?? "" }
      : undefined,
  };
}
