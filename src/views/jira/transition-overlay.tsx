import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { JiraTransition } from "../../api/types.ts";
import {
  getJiraTransitions,
  transitionJiraIssue,
} from "../../api/jira-client.ts";
import { getToken } from "../../utils/tokens.ts";
import { Overlay } from "../../ui/overlay.tsx";
import { useRouteShortcuts } from "../../hooks/use-route-shortcuts.ts";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { useJiraContext } from "./jira-context.ts";
import { getStatusColor } from "../../utils/jira-status.ts";

export function TransitionOverlay() {
  const { navigate } = useRouter();
  const { config, contentHeight: height, width } = useAppContext();
  const { selectedIssue, refetch } = useJiraContext();

  const [transitions, setTransitions] = useState<JiraTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursorIndex, setCursorIndex] = useState(-1); // -1 = Cancel (last item)
  const [applying, setApplying] = useState(false);

  const issueKey = selectedIssue?.key ?? "";
  const currentStatus = selectedIssue?.fields.status.name ?? "";

  // Fetch transitions on mount
  useEffect(() => {
    if (!issueKey) return;
    const jiraToken = getToken("jiraToken");
    if (!jiraToken) return;

    (async () => {
      try {
        const result = await getJiraTransitions(
          config.jiraSite,
          config.jiraEmail,
          jiraToken,
          issueKey,
        );
        setTransitions(result);
        // Default cursor to Cancel (at the end)
        setCursorIndex(result.length);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [issueKey, config.jiraSite, config.jiraEmail]);

  // Total items: transitions + Cancel
  const totalItems = transitions.length + 1;

  useRouteShortcuts({
    close: () => navigate("jira"),
    select: () => {
      if (applying) return;
      // Cancel option
      if (cursorIndex === transitions.length) {
        navigate("jira");
        return;
      }
      const transition = transitions[cursorIndex];
      if (!transition) return;

      const jiraToken = getToken("jiraToken");
      if (!jiraToken) return;

      setApplying(true);
      (async () => {
        try {
          await transitionJiraIssue(
            config.jiraSite,
            config.jiraEmail,
            jiraToken,
            issueKey,
            transition.id,
          );
          refetch();
          navigate("jira");
        } catch (err: any) {
          setError(err.message);
          setApplying(false);
        }
      })();
    },
    up: () => setCursorIndex((i) => Math.max(0, i - 1)),
    down: () => setCursorIndex((i) => Math.min(totalItems - 1, i + 1)),
  });

  const boxWidth = Math.min(50, width - 4);
  const boxHeight = Math.min(height - 4, totalItems + 7);
  const innerWidth = boxWidth - 4;

  if (!selectedIssue) {
    return (
      <Overlay title="Transition" width={boxWidth} height={boxHeight}>
        <Text dimColor>No issue selected</Text>
      </Overlay>
    );
  }

  return (
    <Overlay
      title={`Transition ${issueKey}`}
      width={boxWidth}
      height={boxHeight}
      footer={
        <Text dimColor>
          {applying ? "Applying..." : "Enter: apply | Esc: cancel"}
        </Text>
      }
    >
      <Box marginBottom={1}>
        <Text dimColor>Current: </Text>
        <Text bold>{currentStatus}</Text>
      </Box>
      {loading ? (
        <Spinner label="Loading transitions..." />
      ) : error ? (
        <Text color="red">{error}</Text>
      ) : (
        <>
          {transitions.map((t, i) => {
            const isActive = i === cursorIndex;
            const isCurrent = t.to.name === currentStatus;
            const statusColor = getStatusColor(t.to.statusCategory.key);
            const label = `${isCurrent ? "\u25CF " : "  "}${t.name}`.padEnd(
              innerWidth,
            );

            return (
              <Box key={t.id}>
                <Text
                  backgroundColor={isActive ? "blue" : undefined}
                  color={
                    isActive ? "white" : isCurrent ? statusColor : undefined
                  }
                  bold={isCurrent}
                >
                  {label}
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1}>
            <Text
              backgroundColor={
                cursorIndex === transitions.length ? "blue" : undefined
              }
              color={cursorIndex === transitions.length ? "white" : undefined}
              dimColor={cursorIndex !== transitions.length}
            >
              {"  Cancel".padEnd(innerWidth)}
            </Text>
          </Box>
        </>
      )}
    </Overlay>
  );
}
