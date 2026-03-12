import React from "react";
import { Box, Text } from "ink";
import type { TrackedPackage } from "../api/types.ts";
import { relativeTime } from "../utils/time.ts";

interface Props {
  selectedPackage: TrackedPackage | null;
  width: number;
}

export const DepStatusBar = React.memo(function DepStatusBar({
  selectedPackage,
  width,
}: Props) {
  const refreshText = selectedPackage?.loading
    ? "Searching..."
    : selectedPackage?.lastRefresh
      ? `Last refresh: ${relativeTime(selectedPackage.lastRefresh.toISOString()).text} ago`
      : "";

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      width={width}
    >
      <Box>
        <Text>
          <Text bold> Package: {selectedPackage?.name ?? "none"} </Text>
          <Text dimColor>|</Text>
          <Text> {selectedPackage?.results.length ?? 0} repos </Text>
          <Text dimColor>|</Text>
          <Text dimColor> {refreshText} </Text>
        </Text>
      </Box>
    </Box>
  );
});
