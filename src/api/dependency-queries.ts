import type { DependencyResult } from "./types.ts";

const CONCURRENCY = 5; // max parallel requests to avoid secondary rate limits

async function throttledAll<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  async function next(): Promise<void> {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]!();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
  return results;
}

interface CodeSearchItem {
  name: string;
  path: string;
  repository: {
    full_name: string;
    name: string;
    html_url: string;
  };
}

interface CodeSearchResponse {
  total_count: number;
  items: CodeSearchItem[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface RepoInfo {
  default_branch: string;
}

async function getDefaultBranch(
  token: string,
  fullName: string,
): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!response.ok) return "main";
  const data: RepoInfo = await response.json();
  return data.default_branch || "main";
}

async function searchPackageInOrg(
  token: string,
  org: string,
  packageName: string,
): Promise<DependencyResult[]> {
  const query = encodeURIComponent(
    `"${packageName}" filename:package.json org:${org}`,
  );
  const url = `https://api.github.com/search/code?q=${query}&per_page=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Rate limited — wait a moment and retry");
    }
    throw new Error(`Code search failed: ${response.status}`);
  }

  const data: CodeSearchResponse = await response.json();

  // Only match package.json files (any depth)
  const matches = data.items.filter((item) => item.name === "package.json");

  // Dedupe by repo+path
  const seen = new Set<string>();
  const unique = matches.filter((item) => {
    const key = `${item.repository.full_name}:${item.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Cache default branches per repo to avoid redundant calls
  const branchCache = new Map<string, string>();

  const results: DependencyResult[] = [];

  const tasks = unique.map((item) => async () => {
    try {
      let branch = branchCache.get(item.repository.full_name);
      if (!branch) {
        branch = await getDefaultBranch(token, item.repository.full_name);
        branchCache.set(item.repository.full_name, branch);
      }

      const result = await fetchPackageVersion(
        token,
        item.repository.full_name,
        item.path,
        branch,
        item.repository.html_url,
        packageName,
      );
      if (result) results.push(result);
    } catch {
      // Skip repos where we can't read the file
    }
  });

  await throttledAll(tasks, CONCURRENCY);

  return results;
}

export async function searchPackageUsage(
  token: string,
  orgs: string[],
  packageName: string,
): Promise<DependencyResult[]> {
  // Search orgs sequentially — code search API has a 10 req/min limit
  const orgResults: DependencyResult[][] = [];
  for (const org of orgs) {
    orgResults.push(await searchPackageInOrg(token, org, packageName));
  }

  return orgResults.flat();
}

/** Strip semver range prefixes (^, ~, >=, etc.) and parse into [major, minor, patch] */
function parseSemver(version: string): [number, number, number] | null {
  const cleaned = version.replace(/^[^0-9]*/, "");
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [
    parseInt(match[1]!, 10),
    parseInt(match[2] ?? "0", 10),
    parseInt(match[3] ?? "0", 10),
  ];
}

export function compareDependencyByVersion(
  a: DependencyResult,
  b: DependencyResult,
): number {
  const va = parseSemver(a.version);
  const vb = parseSemver(b.version);
  // Non-parseable versions sink to bottom, sorted by repo name
  if (!va && !vb) return a.repo.localeCompare(b.repo);
  if (!va) return 1;
  if (!vb) return -1;
  // Sort descending (newest first), then by repo name
  for (let i = 0; i < 3; i++) {
    if (va[i]! !== vb[i]!) return vb[i]! - va[i]!;
  }
  return a.repo.localeCompare(b.repo);
}

async function fetchPackageVersion(
  token: string,
  fullName: string,
  path: string,
  branch: string,
  repoUrl: string,
  packageName: string,
): Promise<DependencyResult | null> {
  const url = `https://api.github.com/repos/${fullName}/contents/${path}?ref=${branch}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.content) return null;

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  const pkg: PackageJson = JSON.parse(content);

  const depTypes = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
  ] as const;

  for (const depType of depTypes) {
    const version = pkg[depType]?.[packageName];
    if (version) {
      const repoName =
        path === "package.json"
          ? fullName
          : `${fullName}/${path.replace("/package.json", "")}`;
      return {
        repo: repoName,
        repoUrl,
        version,
        branch,
        depType,
      };
    }
  }

  return null;
}
