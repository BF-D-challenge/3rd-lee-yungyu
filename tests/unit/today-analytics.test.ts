import { beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.hoisted(() => vi.fn());

vi.mock("@/lib/track", () => ({ track }));

import { trackTodayEvent } from "@/lib/today-analytics";

beforeEach(() => {
  track.mockReset();
});

describe("Today 전용 퍼널 이벤트", () => {
  it.each([
    "today_landing_viewed",
    "today_idea_started",
    "today_request_submitted",
    "today_reservation_clicked",
  ] as const)("%s를 Today 고정 정보와 함께 기록한다", (event) => {
    trackTodayEvent(event);

    expect(track).toHaveBeenCalledWith(event, expect.objectContaining({
      event_type: event,
      product_id: "today",
      product_slug: "today",
      product_path: "/today",
    }), { meta: false });

    if (event === "today_landing_viewed") {
      expect(track).toHaveBeenCalledWith("landing_view", { product_id: "today" });
    }
    if (event === "today_idea_started" || event === "today_reservation_clicked") {
      expect(track).toHaveBeenCalledWith("primary_cta", { product_id: "today" });
    }
  });

  it("사용자 원문 없이 시작·신청·예약 문맥만 기록한다", () => {
    trackTodayEvent("today_idea_started", { idea_path: "existing" });
    trackTodayEvent("today_request_submitted", { channel: "instagram", signal: "waitlist" });
    trackTodayEvent("today_reservation_clicked", { placement: "landing" });

    expect(track.mock.calls).toEqual([
      ["today_idea_started", expect.objectContaining({ idea_path: "existing" }), { meta: false }],
      ["primary_cta", { product_id: "today" }],
      ["today_request_submitted", expect.objectContaining({
        channel: "instagram",
        signal: "waitlist",
      }), { meta: false }],
      ["today_reservation_clicked", expect.objectContaining({ placement: "landing" }), { meta: false }],
      ["primary_cta", { product_id: "today" }],
    ]);
  });
});
