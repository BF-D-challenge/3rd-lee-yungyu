import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  metaConversionForEvent,
  trackMetaEvent,
  trackMetaPageView,
} from "../../src/lib/meta-conversions";

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => "meta-event-1" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  vi.stubGlobal("window", {
    location: { pathname: "/" },
  });
});

describe("Meta conversion tracking", () => {
  it("maps the four funnel points to clear standard and custom events", () => {
    expect(metaConversionForEvent("idea_result_viewed", {
      scenario_id: "scenario-1",
      attempt: 2,
    })).toEqual({
      eventName: "ViewContent",
      standard: true,
      params: {
        content_category: "idea_funnel",
        scenario_id: "scenario-1",
        attempt: 2,
        content_name: "idea_result",
        content_type: "product",
        content_ids: ["scenario-1"],
      },
    });
    expect(metaConversionForEvent("idea_selected")).toMatchObject({
      eventName: "IdeaSelected",
      standard: false,
    });
    expect(metaConversionForEvent("idea_first_action_started")).toMatchObject({
      eventName: "FirstActionPlanStarted",
      standard: false,
    });
    expect(metaConversionForEvent("idea_card_read")).toBeNull();
  });

  it("is a network and Pixel no-op when Meta is not configured", () => {
    trackMetaPageView();
    trackMetaEvent("idea_result_viewed", {});
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses one event ID for Pixel and CAPI deduplication", () => {
    const fbq = vi.fn();
    window.__metaPixelConfigured = true;
    window.fbq = fbq;

    trackMetaEvent("idea_selected", {
      scenario_id: "scenario-1",
      attempt: 1,
    });

    expect(fbq).toHaveBeenCalledWith(
      "trackCustom",
      "IdeaSelected",
      expect.objectContaining({ scenario_id: "scenario-1", attempt: 1 }),
      { eventID: "meta-event-1" },
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/meta/events",
      expect.objectContaining({
        body: expect.stringContaining('"event_id":"meta-event-1"'),
        keepalive: true,
      }),
    );
  });
});
