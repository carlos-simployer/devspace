import React from "react";
import { useAppContext } from "../../app-context.ts";
import { HelpOverlay } from "../../components/help-overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";

export function JiraHelpView() {
  const { contentHeight: height, width } = useAppContext();
  useRouteShortcuts({}); // activates global help-close behavior
  return <HelpOverlay height={height} width={width} route="jira" />;
}
