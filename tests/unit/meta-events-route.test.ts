import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/meta/events/route";

const eventBody = JSON.stringify({
  event_name: "IdeaSelected",
  event_id: "meta-event-1",
  event_source_path: "/",
  custom_data: {
    scenario_id: "scenario-1",
    attempt: 1,
    ignored_copy: "사용자 문구",
  },
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Meta CAPI route", () => {
  it("returns a safe no-op when server configuration is absent", async () => {
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

  it("allowlists fields and keeps the access token in the server request", async () => {
    vi.stubEnv("META_DATASET_ID", "1234567890");
    vi.stubEnv("META_CONVERSIONS_API_TOKEN", "test-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v25.0");
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
    };
    expect(payload.data[0].custom_data).toEqual({
      scenario_id: "scenario-1",
      attempt: 1,
    });
    expect(JSON.stringify(payload)).not.toContain("사용자 문구");
  });
});
