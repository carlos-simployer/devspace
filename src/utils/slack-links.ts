/**
 * Build Slack deep links for opening in the Slack app.
 */

export function slackChannelLink(teamId: string, channelId: string): string {
  return `slack://channel?team=${teamId}&id=${channelId}`;
}

export function slackMessageLink(
  teamId: string,
  channelId: string,
  messageTs: string,
): string {
  return `slack://channel?team=${teamId}&id=${channelId}&message=${messageTs}`;
}
