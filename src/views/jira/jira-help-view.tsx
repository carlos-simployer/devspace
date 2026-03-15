import React from "react";
import { useAppContext } from "../../app-context.ts";
import { HelpOverlay } from "../../components/help-overlay.tsx";

export function JiraHelpView() {
  const { contentHeight: height, width } = useAppContext();
  return <HelpOverlay height={height} width={width} route="jira" />;
}
