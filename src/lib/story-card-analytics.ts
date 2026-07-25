import { track } from "./track";
import type { StoryCardId } from "./story-card-contract";

export type StoryCardEventName =
  | "viewed"
  | "request_failed"
  | "situation_selected"
  | "chat_started"
  | "message_sent"
  | "chat_abandoned";

type StoryCardEventParams = {
  cardId?: StoryCardId;
  stage?: "load" | "start" | "reply";
  messageCount?: number;
};

/**
 * Story-card events deliberately allow only non-personal IDs and funnel counters.
 * Story copy, error messages, and free-form text never enter the shared event log.
 */
export function trackStoryCardEvent(
  event: StoryCardEventName,
  params: StoryCardEventParams = {},
): void {
  const safeParams: Record<string, string | number> = {};
  if (params.cardId) safeParams.card_id = params.cardId;
  if (params.stage) safeParams.stage = params.stage;
  if (
    Number.isInteger(params.messageCount)
    && Number(params.messageCount) >= 1
    && Number(params.messageCount) <= 50
  ) {
    safeParams.message_count = Number(params.messageCount);
  }

  track(`story_card_${event}`, {
    event_type: `story_card_${event}`,
    entry_path: "/story-cards",
    ...safeParams,
  });
}
