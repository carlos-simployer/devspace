import React, { useMemo } from "react";
import { SearchList, type SearchListItem } from "../../ui/search-list.tsx";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useReleasesContext } from "./releases-context.ts";

/**
 * DefinitionSearch — uses the generic SearchList component.
 * Rendered as an overlay route child of ReleasesLayout.
 */
export function DefinitionSearch() {
  const {
    config,
    addPinnedReleaseDefinition,
    removePinnedReleaseDefinition,
    contentHeight: height,
    width,
  } = useAppContext();
  const { allDefinitions: definitions, allDefsLoading: loading } =
    useReleasesContext();
  const { navigate } = useRouter();
  const pinnedIds = config.pinnedReleaseDefinitions;

  const items: SearchListItem[] = useMemo(
    () =>
      definitions.map((d) => ({
        key: String(d.id),
        label: d.name,
        isSelected: pinnedIds.includes(d.id),
      })),
    [definitions, pinnedIds],
  );

  const boxWidth = Math.min(60, width - 4);
  const boxHeight = Math.min(height - 4, 24);

  return (
    <SearchList
      title="Add / Remove Release Definition"
      items={items}
      loading={loading}
      loadingLabel="Loading definitions..."
      emptyLabel="No definitions found"
      width={boxWidth}
      height={boxHeight}
      onSelect={(_index, item) => {
        const id = Number(item.key);
        if (pinnedIds.includes(id)) {
          removePinnedReleaseDefinition(id);
        } else {
          addPinnedReleaseDefinition(id);
        }
      }}
      onClose={() => navigate("releases")}
    />
  );
}
