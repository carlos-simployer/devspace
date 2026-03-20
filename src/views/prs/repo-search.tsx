import React, { useMemo } from "react";
import { SearchList, type SearchListItem } from "../../ui/search-list.tsx";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { usePrsContext } from "./prs-context.ts";

/**
 * RepoSearch — reads data from PrsContext.
 * Rendered as an overlay route child of PrsLayout.
 * Uses the generic SearchList component.
 */
export function RepoSearch() {
  const { height, width } = useAppContext();
  const { navigate } = useRouter();
  const {
    orgRepos: repos,
    repos: pinnedRepos,
    reposLoading: loading,
    addRepo,
    removeRepo,
  } = usePrsContext();

  const multiOrg = useMemo(() => {
    const orgs = new Set(repos.map((r) => r.owner));
    return orgs.size > 1;
  }, [repos]);

  const items: SearchListItem[] = useMemo(
    () =>
      repos.map((r) => {
        const qualified = `${r.owner}/${r.name}`;
        return {
          key: qualified,
          label: multiOrg ? qualified : r.name,
          isSelected: pinnedRepos.includes(qualified),
        };
      }),
    [repos, pinnedRepos, multiOrg],
  );

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);

  return (
    <SearchList
      title="Add / Remove Repository"
      items={items}
      loading={loading}
      loadingLabel="Loading repos..."
      emptyLabel="No repos found"
      width={boxWidth}
      height={boxHeight}
      onSelect={(_index, item) => {
        const qualified = item.key;
        if (pinnedRepos.includes(qualified)) {
          removeRepo(qualified);
        } else {
          addRepo(qualified);
        }
      }}
      onClose={() => navigate("prs")}
    />
  );
}
