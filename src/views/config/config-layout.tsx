import React from "react";
import { Box } from "ink";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";

export function ConfigLayout() {
  const { contentHeight: height, width } = useAppContext();
  const outlet = useOutlet();

  // For overlay children: center them
  if (outlet?.isOverlay) {
    return (
      <Box
        height={height}
        width={width}
        alignItems="center"
        justifyContent="center"
      >
        <Outlet />
      </Box>
    );
  }

  // For full children (index): render directly
  return <Outlet />;
}
