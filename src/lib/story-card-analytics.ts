import { track } from "./track";
import type { StoryCardId } from "./story-card-contract";

export type StoryCardEventName =
  | "story_cards_landing_viewed"
  | "story_card_selected"
  | "story_chat_started"
  | "story_cards_reservation_clicked"
  | "story_card_request_failed"
  | "story_card_chat_resumed"
  | "story_card_message_sent"
  | "story_card_chat_abandoned";

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

  track(event, {
    event_type: event,
    entry_path: "/story-cards",
    ...safeParams,
  }, { meta: false });
}
