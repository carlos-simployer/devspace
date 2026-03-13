import type { PullRequest, SortMode } from "../api/types.ts";

export function prListChanged(a: PullRequest[], b: PullRequest[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].updatedAt !== b[i].updatedAt) return true;
  }
  return false;
}

export function sortPRs(prs: PullRequest[], sortMode: SortMode): PullRequest[] {
  const sorted = [...prs];
  switch (sortMode) {
    case "repo-updated":
      sorted.sort((a, b) => {
        const repoA = `${a.repository.owner.login}/${a.repository.name}`;
        const repoB = `${b.repository.owner.login}/${b.repository.name}`;
        const repoCompare = repoA.localeCompare(repoB);
        if (repoCompare !== 0) return repoCompare;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      break;
    case "updated":
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
      break;
  }
  return sorted;
}
