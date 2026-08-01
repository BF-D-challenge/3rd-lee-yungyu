import { track } from "@/lib/track";
import { trackMvpLandingViewed, trackMvpPrimaryCta } from "@/lib/mvp-experiment-analytics";

export type TodayEventName =
  | "today_landing_viewed"
  | "today_idea_started"
  | "today_request_submitted"
  | "today_reservation_clicked";

type TodayEventParams = {
  idea_path?: "existing" | "guided";
  channel?: "instagram" | "community" | "direct";
  signal?: "waitlist" | "interview" | "deposit";
  placement?: "landing" | "queued";
};

/** Today 이벤트에는 사용자가 쓴 아이디어나 이메일을 넣지 않는다. */
export function trackTodayEvent(
  event: TodayEventName,
  params: TodayEventParams = {},
): void {
  track(event, {
    event_type: event,
    funnel_stage: event === "today_landing_viewed"
      ? "landing"
      : event === "today_idea_started"
        ? "idea"
        : event === "today_request_submitted"
          ? "request"
          : "reservation",
    product_id: "today",
    product_slug: "today",
    product_path: "/today",
    ...params,
  }, { meta: false });
  if (event === "today_landing_viewed") trackMvpLandingViewed("today");
  if (event === "today_idea_started" || event === "today_reservation_clicked") {
    trackMvpPrimaryCta("today");
  }
}
