import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  META_CLIENT_CUSTOM_DATA_KEYS,
  META_CLIENT_EVENT_NAMES,
  metaConversionForEvent,
  trackMetaEvent,
  trackMetaPageView,
} from "../../src/lib/meta-conversions";

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => "meta-event-1" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  vi.stubGlobal("window", {
    location: { pathname: "/", search: "" },
  });
});

describe("Meta conversion tracking", () => {
  it("defines the complete client event and custom-data allowlists", () => {
    expect(META_CLIENT_EVENT_NAMES).toEqual([
      "PageView",
      "ViewContent",
      "CompleteRegistration",
      "MvpLandingView",
      "MvpPrimaryCta",
      "MvpInstagramInputStarted",
      "MvpReservationCompleted",
      "IdeaSelected",
      "FirstActionPlanStarted",
    ]);
    expect(META_CLIENT_CUSTOM_DATA_KEYS).toEqual([
      "product_id",
      "creative_id",
      "landing_variant",
      "slot_key",
      "storage_mode",
      "submit_success",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]);
  });

  it.each([
    ["landing_view", "MvpLandingView", false],
    ["primary_cta", "MvpPrimaryCta", false],
    ["instagram_input_started", "MvpInstagramInputStarted", false],
    ["login_completed", "CompleteRegistration", true],
    ["reservation_completed", "MvpReservationCompleted", false],
  ] as const)("maps %s to the shared Meta contract", (event, eventName, standard) => {
    expect(metaConversionForEvent(event, {
      product_id: "matpick",
      creative_id: "creative-a",
      landing_variant: "hero-b",
      slot_key: "this-week",
      storage_mode: "supabase",
      submit_success: true,
      utm_source: "meta",
    })).toEqual({
      eventName,
      standard,
      params: {
        product_id: "matpick",
        creative_id: "creative-a",
        landing_variant: "hero-b",
        slot_key: "this-week",
        storage_mode: "supabase",
        submit_success: true,
        utm_source: "meta",
      },
    });
  });

  it("maps existing product UI aliases to the common funnel", () => {
    expect(metaConversionForEvent("onebite_fake_door_landing_viewed", {
      product: "onebite",
    })).toMatchObject({ eventName: "MvpLandingView" });
    expect(metaConversionForEvent("onebite_instagram_submitted", {
      product: "onebite",
    })).toMatchObject({ eventName: "MvpPrimaryCta" });
    expect(metaConversionForEvent("onebite_instagram_input_started", {
      product: "onebite",
    })).toMatchObject({ eventName: "MvpInstagramInputStarted" });
    expect(metaConversionForEvent("fake_door_reservation_login_completed", {
      product: "today",
      method: "google",
    })).toMatchObject({ eventName: "CompleteRegistration" });
    expect(metaConversionForEvent("fake_door_reservation_completed", {
      product: "story-cards",
      slot_key: "next-week",
      storage_mode: "supabase",
    })).toEqual({
      eventName: "MvpReservationCompleted",
      standard: false,
      params: {
        product_id: "story-cards",
        slot_key: "next-week",
        storage_mode: "supabase",
        submit_success: true,
      },
    });
  });

  it("rejects demo login, demo reservation, failed submit, and unknown products", () => {
    expect(metaConversionForEvent("fake_door_reservation_login_completed", {
      product: "onebite",
      method: "demo",
    })).toBeNull();
    expect(metaConversionForEvent("fake_door_reservation_completed", {
      product: "onebite",
      storage_mode: "local_demo",
    })).toBeNull();
    expect(metaConversionForEvent("reservation_completed", {
      product_id: "onebite",
      storage_mode: "supabase",
      submit_success: false,
    })).toBeNull();
    expect(metaConversionForEvent("landing_view", { product_id: "private_handle" })).toBeNull();
  });

  it("drops Instagram IDs, names, ideas, and every non-allowlisted property", () => {
    const conversion = metaConversionForEvent("primary_cta", {
      product_id: "today",
      creative_id: "creative-a",
      instagram_id: "private_handle",
      instagram_handle: "private_handle",
      name: "Private Name",
      idea_text: "사용자가 입력한 아이디어 원문",
      content_name: "also-not-allowed",
    });
    expect(conversion?.params).toEqual({
      product_id: "today",
      creative_id: "creative-a",
    });
    expect(JSON.stringify(conversion)).not.toContain("private_handle");
    expect(JSON.stringify(conversion)).not.toContain("Private Name");
    expect(JSON.stringify(conversion)).not.toContain("아이디어 원문");
  });

  it("keeps legacy idea events but sends only the approved UTM properties", () => {
    expect(metaConversionForEvent("idea_result_viewed", {
      scenario_id: "scenario-1",
      idea_text: "private idea",
      utm_campaign: "campaign-a",
    })).toEqual({
      eventName: "ViewContent",
      standard: true,
      params: { utm_campaign: "campaign-a" },
    });
    expect(metaConversionForEvent("idea_card_read")).toBeNull();
  });

  it("is a network and Pixel no-op when Meta Pixel is not configured", () => {
    trackMetaPageView();
    trackMetaEvent("landing_view", { product_id: "onebite" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses one event ID and identical custom data for Pixel and CAPI", () => {
    const fbq = vi.fn();
    window.__metaPixelConfigured = true;
    window.fbq = fbq;

    trackMetaEvent("primary_cta", {
      product_id: "onebite",
      creative_id: "creative-a",
      event_id: "shared-event-1",
    });

    const expectedParams = { product_id: "onebite", creative_id: "creative-a" };
    expect(fbq).toHaveBeenCalledWith(
      "trackCustom",
      "MvpPrimaryCta",
      expectedParams,
      { eventID: "shared-event-1" },
    );
    const request = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      event_name: "MvpPrimaryCta",
      event_id: "shared-event-1",
      event_source_path: "/",
      custom_data: expectedParams,
    });
  });
});
