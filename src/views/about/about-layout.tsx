import React from "react";
import { Box } from "ink";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";

export function AboutLayout() {
  const { contentHeight: height, width } = useAppContext();
  const outlet = useOutlet();

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

  return <Outlet />;
}
