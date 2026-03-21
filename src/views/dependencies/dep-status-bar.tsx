import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { TrackedPackage } from "../../api/types.ts";
import { Panel } from "../../ui/panel.tsx";
import { relativeTime } from "../../utils/time.ts";

interface Props {
  selectedPackage: TrackedPackage | null;
  width: number;
}

export const DepStatusBar = React.memo(function DepStatusBar({
  selectedPackage,
  width,
}: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const refreshText = selectedPackage?.loading
    ? "Searching..."
    : selectedPackage?.lastRefresh
      ? `Last refresh: ${relativeTime(selectedPackage.lastRefresh.toISOString()).text} ago`
      : "";

  return (
    <Panel width={width} paddingX={0}>
      <Box>
        <Text>
          <Text bold> Package: {selectedPackage?.name ?? "none"} </Text>
          <Text dimColor>|</Text>
          <Text> {selectedPackage?.results.length ?? 0} repos </Text>
          <Text dimColor>|</Text>
          <Text dimColor> {refreshText} </Text>
        </Text>
      </Box>
    </Panel>
  );
});
