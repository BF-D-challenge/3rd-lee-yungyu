import { track } from "./track";
import type { StoryCardId, StoryChoiceId } from "./story-card-contract";

export type StoryCardEventName =
  | "viewed"
  | "draw_requested"
  | "draw_completed"
  | "request_failed"
  | "choice_made"
  | "story_completed"
  | "story_abandoned";

type StoryCardEventParams = {
  cardId?: StoryCardId;
  choiceId?: StoryChoiceId;
  drawNumber?: number;
  stage?: "draw" | "choose";
  turn?: number;
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
  if (params.choiceId) safeParams.choice_id = params.choiceId;
  if (Number.isInteger(params.drawNumber) && Number(params.drawNumber) > 0) {
    safeParams.draw_number = Number(params.drawNumber);
  }
  if (params.stage) safeParams.stage = params.stage;
  if (Number.isInteger(params.turn) && Number(params.turn) >= 1 && Number(params.turn) <= 8) {
    safeParams.turn = Number(params.turn);
  }

  track(`story_card_${event}`, {
    event_type: `story_card_${event}`,
    entry_path: "/story-cards",
    ...safeParams,
  });
}
