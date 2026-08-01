import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/meta/events/route";

const eventBody = JSON.stringify({
  event_name: "MvpPrimaryCta",
  event_id: "meta-event-1",
  event_source_path: "/matpick",
  custom_data: {
    product_id: "matpick",
    creative_id: "creative-a",
    landing_variant: "hero-b",
    slot_key: "this-week",
    storage_mode: "supabase",
    submit_success: true,
    utm_source: "meta",
    utm_medium: "paid-social",
    utm_campaign: "launch-a",
    utm_content: "video-a",
    utm_term: "food-coach",
    instagram_id: "private_handle",
    name: "Private Name",
    idea_text: "사용자가 입력한 아이디어 원문",
  },
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Meta CAPI route", () => {
  it("returns a safe 204 no-op when server configuration is absent", async () => {
    vi.stubEnv("META_DATASET_ID", "");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "");
    const upstream = vi.spyOn(globalThis, "fetch");

    const response = await POST(new NextRequest("https://example.com/api/meta/events", {
      method: "POST",
      body: eventBody,
    }));

    expect(response.status).toBe(204);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects cross-site event relays before contacting Meta", async () => {
    vi.stubEnv("META_DATASET_ID", "1234567890");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
    const upstream = vi.spyOn(globalThis, "fetch");

    const response = await POST(new NextRequest("https://example.com/api/meta/events", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
      body: eventBody,
    }));

    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("allowlists custom data, strips private fields, and keeps the token server-only", async () => {
    vi.stubEnv("META_DATASET_ID", "1234567890");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v25.0");
    vi.stubEnv("META_TEST_EVENT_CODE", "TEST12345");
    const upstream = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const response = await POST(new NextRequest("https://example.com/api/meta/events", {
      method: "POST",
      headers: {
        "user-agent": "test-browser",
        "x-forwarded-for": "203.0.113.10",
      },
      body: eventBody,
    }));

    expect(response.status).toBe(204);
    expect(upstream).toHaveBeenCalledWith(
      "https://graph.facebook.com/v25.0/1234567890/events",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer test-token" }),
      }),
    );
    const init = upstream.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(init.body)) as {
      data: Array<{ custom_data: Record<string, unknown> }>;
      test_event_code?: string;
    };
    expect(payload.test_event_code).toBe("TEST12345");
    expect(payload.data[0].custom_data).toEqual({
      product_id: "matpick",
      creative_id: "creative-a",
      landing_variant: "hero-b",
      slot_key: "this-week",
      storage_mode: "supabase",
      submit_success: true,
      utm_source: "meta",
      utm_medium: "paid-social",
      utm_campaign: "launch-a",
      utm_content: "video-a",
      utm_term: "food-coach",
    });
    expect(JSON.stringify(payload)).not.toContain("private_handle");
    expect(JSON.stringify(payload)).not.toContain("Private Name");
    expect(JSON.stringify(payload)).not.toContain("아이디어 원문");
  });

  it.each([
    ["MvpLandingView", {}],
    ["MvpPrimaryCta", {}],
    ["MvpInstagramInputStarted", {}],
    ["CompleteRegistration", {}],
    ["MvpReservationCompleted", { storage_mode: "supabase", submit_success: true }],
  ])("accepts the four-product %s CAPI contract", async (eventName, extraData) => {
    vi.stubEnv("META_DATASET_ID", "1234567890");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
    const upstream = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const response = await POST(new NextRequest("https://example.com/api/meta/events", {
      method: "POST",
      body: JSON.stringify({
        event_name: eventName,
        event_id: `event-${eventName}`,
        event_source_path: "/story-cards",
        custom_data: {
          product_id: "story-cards",
          slot_key: "this-week",
          ...extraData,
        },
      }),
    }));

    expect(response.status).toBe(204);
    const init = upstream.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(init.body)) as {
      data: Array<{ event_name: string; custom_data: Record<string, unknown> }>;
    };
    expect(payload.data[0]).toMatchObject({
      event_name: eventName,
      custom_data: { product_id: "story-cards", slot_key: "this-week" },
    });
  });

  it.each(["PageView", "ViewContent", "IdeaSelected", "FirstActionPlanStarted"])(
    "accepts the non-product client event %s",
    async (eventName) => {
      vi.stubEnv("META_DATASET_ID", "1234567890");
      vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
      const upstream = vi.spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response(null, { status: 200 }));
      const response = await POST(new NextRequest("https://example.com/api/meta/events", {
        method: "POST",
        body: JSON.stringify({
          event_name: eventName,
          event_id: `event-${eventName}`,
          event_source_path: "/",
          custom_data: { utm_campaign: "launch-a" },
        }),
      }));

      expect(response.status).toBe(204);
      const init = upstream.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(String(init.body)).data[0]).toMatchObject({
        event_name: eventName,
        custom_data: { utm_campaign: "launch-a" },
      });
    },
  );

  it("rejects demo-like or failed reservation conversions", async () => {
    vi.stubEnv("META_DATASET_ID", "1234567890");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
    const upstream = vi.spyOn(globalThis, "fetch");

    for (const customData of [
      { product_id: "onebite", storage_mode: "local_demo", submit_success: true },
      { product_id: "onebite", storage_mode: "supabase", submit_success: false },
    ]) {
      const response = await POST(new NextRequest("https://example.com/api/meta/events", {
        method: "POST",
        body: JSON.stringify({
          event_name: "MvpReservationCompleted",
          event_id: "reservation-event-1",
          event_source_path: "/reserve/onebite",
          custom_data: customData,
        }),
      }));
      expect(response.status).toBe(400);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  it("ignores malformed Meta test-event codes", async () => {
    vi.stubEnv("META_DATASET_ID", "1234567890");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
    vi.stubEnv("META_TEST_EVENT_CODE", "not-a-test-code");
    const upstream = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await POST(new NextRequest("https://example.com/api/meta/events", {
      method: "POST",
      body: eventBody,
    }));

    const init = upstream.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).not.toHaveProperty("test_event_code");
  });
});
