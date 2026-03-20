import React from "react";
import { Box } from "ink";
import { useAppContext } from "../../app-context.ts";
import { Outlet, useOutlet } from "../../ui/router.ts";
import { ConfigMainView } from "./config-main-view.tsx";

export function ConfigLayout() {
  const { contentHeight: height, width } = useAppContext();
  const outlet = useOutlet();

  const isOverlay = outlet?.isOverlay ?? false;

  return (
    <Box height={height} width={width}>
      {/* Main content layer -- always show index view */}
      <Box height={height} width={width} flexDirection="column">
        {isOverlay ? <ConfigMainView /> : <Outlet />}
      </Box>

      {/* Overlay layer -- dialog on top */}
      {isOverlay && (
        <Box
          position="absolute"
          width={width}
          height={height}
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      )}
    </Box>
  );
}
