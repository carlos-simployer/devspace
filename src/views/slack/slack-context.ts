import { createContext, useContext } from "react";
import type {
  SlackChannel,
  SlackMessage,
  SlackUser,
  FocusArea,
} from "../../api/types.ts";
import type { useSlackMutations } from "../../hooks/use-slack-mutations.ts";

export type SlackInputMode = "none" | "compose" | "reply";

export interface SlackContextValue {
  // Layout
  contentHeight: number;

  // Focus
  focus: FocusArea;
  setFocus: (v: FocusArea) => void;

  // Selection
  sidebarIndex: number;
  setSidebarIndex: (v: number | ((prev: number) => number)) => void;
  messageIndex: number;
  setMessageIndex: (v: number | ((prev: number) => number)) => void;

  // Channel
  selectedChannel: SlackChannel | null;
  channels: SlackChannel[];

  // Messages
  messages: SlackMessage[];
  selectedMessage: SlackMessage | null;
  loading: boolean;
  fetching: boolean;
  error: string | null;

  // Input
  inputMode: SlackInputMode;
  setInputMode: (v: SlackInputMode) => void;
  inputText: string;
  setInputText: (v: string | ((prev: string) => string)) => void;

  // Status
  statusMessage: string;
  showStatus: (msg: string) => void;

  // User info
  currentUserId: string;
  teamId: string;
  userCache: Map<string, SlackUser>;
  ensureUsers: (ids: string[]) => void;
  presenceMap: Map<string, "active" | "away">;

  // Config mutations
  addSlackChannel: (id: string) => void;
  removeSlackChannel: (id: string) => void;

  // Data mutations
  mutations: ReturnType<typeof useSlackMutations>;
  refetch: () => void;
}

export const SlackContext = createContext<SlackContextValue>(null!);

export function useSlackContext(): SlackContextValue {
  const ctx = useContext(SlackContext);
  if (ctx === null) {
    throw new Error(
      "useSlackContext must be used within SlackContext.Provider",
    );
  }
  return ctx;
}
