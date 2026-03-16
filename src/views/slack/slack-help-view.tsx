import React from "react";
import { useAppContext } from "../../app-context.ts";
import { HelpOverlay } from "../../components/help-overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";

export function SlackHelpView() {
  const { height, width } = useAppContext();
  useRouteShortcuts({});
  return <HelpOverlay height={height} width={width} route="slack" />;
}
