import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postSlackMessage,
  deleteSlackMessage,
  addSlackReaction,
  removeSlackReaction,
  setSlackPresence,
  setSlackUserStatus,
  markSlackConversation,
} from "../api/slack-client.ts";

export function useSlackMutations(token: string) {
  const qc = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: ({
      channel,
      text,
      threadTs,
    }: {
      channel: string;
      text: string;
      threadTs?: string;
    }) => postSlackMessage(token, channel, text, threadTs),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["slack-messages", vars.channel] });
      if (vars.threadTs) {
        qc.invalidateQueries({
          queryKey: ["slack-thread", vars.channel, vars.threadTs],
        });
      }
    },
  });

  const deleteMessage = useMutation({
    mutationFn: ({ channel, ts }: { channel: string; ts: string }) =>
      deleteSlackMessage(token, channel, ts),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["slack-messages", vars.channel] });
    },
  });

  const addReaction = useMutation({
    mutationFn: ({
      channel,
      ts,
      emoji,
    }: {
      channel: string;
      ts: string;
      emoji: string;
    }) => addSlackReaction(token, channel, ts, emoji),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["slack-messages", vars.channel] });
    },
  });

  const removeReaction = useMutation({
    mutationFn: ({
      channel,
      ts,
      emoji,
    }: {
      channel: string;
      ts: string;
      emoji: string;
    }) => removeSlackReaction(token, channel, ts, emoji),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["slack-messages", vars.channel] });
    },
  });

  const setPresence = useMutation({
    mutationFn: ({ presence }: { presence: "auto" | "away" }) =>
      setSlackPresence(token, presence),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slack-presence"] });
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ text, emoji }: { text: string; emoji: string }) =>
      setSlackUserStatus(token, text, emoji),
  });

  const markRead = useMutation({
    mutationFn: ({ channel, ts }: { channel: string; ts: string }) =>
      markSlackConversation(token, channel, ts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slack-channels"] });
    },
  });

  return {
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setPresence,
    setStatus,
    markRead,
  };
}
