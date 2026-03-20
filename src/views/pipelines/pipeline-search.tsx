import React, { useMemo } from "react";
import { SearchList, type SearchListItem } from "../../ui/search-list.tsx";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { usePipelinesContext } from "./pipelines-context.ts";

/**
 * PipelineSearch — uses the generic SearchList component.
 * Rendered as an overlay route child of PipelinesLayout.
 */
export function PipelineSearch() {
  const {
    config,
    addPinnedPipeline,
    removePinnedPipeline,
    contentHeight: height,
    width,
  } = useAppContext();
  const { definitions, defsLoading: loading } = usePipelinesContext();
  const { navigate } = useRouter();
  const pinnedIds = config.pinnedPipelines;

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
      title="Add / Remove Pipeline"
      items={items}
      loading={loading}
      loadingLabel="Loading pipeline definitions..."
      emptyLabel="No pipeline definitions found"
      width={boxWidth}
      height={boxHeight}
      onSelect={(_index, item) => {
        const id = Number(item.key);
        if (pinnedIds.includes(id)) {
          removePinnedPipeline(id);
        } else {
          addPinnedPipeline(id);
        }
      }}
      onClose={() => navigate("pipelines")}
    />
  );
}
