import type {
  SlackAuthInfo,
  SlackConversationListResponse,
  SlackHistoryResponse,
  SlackRepliesResponse,
  SlackPostMessageResponse,
  SlackChannel,
  SlackUser,
  SlackPresence,
} from "./types.ts";

interface SlackResponse {
  ok: boolean;
  error?: string;
}

async function slackFetch<T extends SlackResponse>(
  token: string,
  method: string,
  params?: Record<string, any>,
): Promise<T> {
  const url = `https://slack.com/api/${method}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: params ? JSON.stringify(params) : undefined,
  });

  // Rate limited — retry once after Retry-After
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    const retry = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: params ? JSON.stringify(params) : undefined,
    });
    if (!retry.ok) {
      throw new Error(`Slack API HTTP error: ${retry.status}`);
    }
    const data = (await retry.json()) as T;
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
    return data;
  }

  if (!res.ok) {
    throw new Error(`Slack API HTTP error: ${res.status}`);
  }

  const data = (await res.json()) as T;
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

// --- Auth ---

export async function testSlackAuth(token: string): Promise<SlackAuthInfo> {
  return slackFetch<SlackAuthInfo>(token, "auth.test");
}

// --- Conversations ---

export async function listSlackConversations(
  token: string,
  types: string = "public_channel,private_channel,mpim,im",
  cursor?: string,
): Promise<SlackConversationListResponse> {
  return slackFetch<SlackConversationListResponse>(
    token,
    "conversations.list",
    {
      types,
      limit: 200,
      exclude_archived: true,
      ...(cursor ? { cursor } : {}),
    },
  );
}

export async function getSlackConversationInfo(
  token: string,
  channel: string,
): Promise<SlackChannel> {
  const data = await slackFetch<{
    ok: boolean;
    channel: SlackChannel;
    error?: string;
  }>(token, "conversations.info", {
    channel,
    include_num_members: false,
  });
  return data.channel;
}

export async function getSlackHistory(
  token: string,
  channel: string,
  limit: number = 50,
  cursor?: string,
): Promise<SlackHistoryResponse> {
  return slackFetch<SlackHistoryResponse>(token, "conversations.history", {
    channel,
    limit,
    ...(cursor ? { cursor } : {}),
  });
}

export async function getSlackReplies(
  token: string,
  channel: string,
  ts: string,
  cursor?: string,
): Promise<SlackRepliesResponse> {
  return slackFetch<SlackRepliesResponse>(token, "conversations.replies", {
    channel,
    ts,
    ...(cursor ? { cursor } : {}),
  });
}

// --- Messages ---

export async function postSlackMessage(
  token: string,
  channel: string,
  text: string,
  threadTs?: string,
): Promise<SlackPostMessageResponse> {
  return slackFetch<SlackPostMessageResponse>(token, "chat.postMessage", {
    channel,
    text,
    ...(threadTs ? { thread_ts: threadTs } : {}),
  });
}

export async function deleteSlackMessage(
  token: string,
  channel: string,
  ts: string,
): Promise<void> {
  await slackFetch<SlackResponse>(token, "chat.delete", { channel, ts });
}

// --- Reactions ---

export async function addSlackReaction(
  token: string,
  channel: string,
  ts: string,
  name: string,
): Promise<void> {
  await slackFetch<SlackResponse>(token, "reactions.add", {
    channel,
    timestamp: ts,
    name,
  });
}

export async function removeSlackReaction(
  token: string,
  channel: string,
  ts: string,
  name: string,
): Promise<void> {
  await slackFetch<SlackResponse>(token, "reactions.remove", {
    channel,
    timestamp: ts,
    name,
  });
}

// --- Users ---

export async function getSlackUserInfo(
  token: string,
  userId: string,
): Promise<SlackUser> {
  const data = await slackFetch<{
    ok: boolean;
    user: {
      id: string;
      name: string;
      real_name: string;
      profile: {
        display_name: string;
        status_text: string;
        status_emoji: string;
        image_24?: string;
        image_48?: string;
      };
      is_bot: boolean;
      deleted: boolean;
    };
    error?: string;
  }>(token, "users.info", { user: userId });
  return {
    id: data.user.id,
    name: data.user.name,
    real_name: data.user.real_name,
    display_name: data.user.profile.display_name || data.user.real_name,
    profile: data.user.profile,
    is_bot: data.user.is_bot,
    deleted: data.user.deleted,
  };
}

export async function getSlackUserPresence(
  token: string,
  userId: string,
): Promise<SlackPresence> {
  const data = await slackFetch<{
    ok: boolean;
    presence: "active" | "away";
    error?: string;
  }>(token, "users.getPresence", { user: userId });
  return { presence: data.presence, online: data.presence === "active" };
}

// --- Presence & Status ---

export async function setSlackPresence(
  token: string,
  presence: "auto" | "away",
): Promise<void> {
  await slackFetch<SlackResponse>(token, "users.setPresence", { presence });
}

export async function setSlackUserStatus(
  token: string,
  statusText: string,
  statusEmoji: string,
  expiration?: number,
): Promise<void> {
  await slackFetch<SlackResponse>(token, "users.profile.set", {
    profile: {
      status_text: statusText,
      status_emoji: statusEmoji,
      ...(expiration ? { status_expiration: expiration } : {}),
    },
  });
}

// --- Mark read ---

export async function markSlackConversation(
  token: string,
  channel: string,
  ts: string,
): Promise<void> {
  await slackFetch<SlackResponse>(token, "conversations.mark", {
    channel,
    ts,
  });
}
