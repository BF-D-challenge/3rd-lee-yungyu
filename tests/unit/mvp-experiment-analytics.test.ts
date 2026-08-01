import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MVP_DEFINITIONS,
  MVP_FUNNEL_EVENT_MAP,
  MVP_FUNNEL_STAGES,
  markMvpSignupPending,
  trackMvpDeepAction,
  trackMvpFunnelStage,
  trackMvpInputStarted,
  trackMvpInstagramInputStarted,
  trackMvpLandingViewed,
  trackMvpLoginCompleted,
  trackMvpReservationCompleted,
  trackMvpResultViewed,
  trackMvpSignupCompleted,
} from "../../src/lib/mvp-experiment-analytics";

const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("sessionStorage", makeStorage());
  vi.stubGlobal("crypto", { randomUUID: vi.fn()
    .mockReturnValueOnce("event-1")
    .mockReturnValueOnce("session-1")
    .mockReturnValue("event-next") });
  vi.stubGlobal("window", { location: { pathname: "/today", search: "" } });
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
});

describe("BF.D four-product funnel contract", () => {
  it("defines the same five stages and source-event map for every product", () => {
    expect(MVP_FUNNEL_STAGES).toEqual([
      "landing_view",
      "primary_cta",
      "instagram_input_started",
      "login_completed",
      "reservation_completed",
    ]);
    expect(Object.keys(MVP_FUNNEL_EVENT_MAP)).toEqual([
      "matpick",
      "onebite",
      "today",
      "story-cards",
    ]);
    for (const mapping of Object.values(MVP_FUNNEL_EVENT_MAP)) {
      expect(Object.keys(mapping)).toEqual(MVP_FUNNEL_STAGES);
    }
  });

  it("emits comparable common events for all four products", () => {
    const experimentIds = ["tastepin", "onebite", "today", "story_cards"] as const;
    for (const experimentId of experimentIds) {
      trackMvpLandingViewed(experimentId);
      trackMvpInputStarted(experimentId);
      trackMvpInstagramInputStarted(experimentId);
    }

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events.map((entry) => entry.event)).toEqual(
      experimentIds.flatMap(() => ["landing_view", "primary_cta", "instagram_input_started"]),
    );
    expect(events.map((entry) => entry.product_id)).toEqual([
      "matpick", "matpick", "matpick",
      "onebite", "onebite", "onebite",
      "today", "today", "today",
      "story-cards", "story-cards", "story-cards",
    ]);
    for (const event of events) {
      expect(event).toMatchObject({
        page_path: "/today",
        session_id: "session-1",
        source: "direct",
        utm_source: "not_set",
        utm_medium: "not_set",
        utm_campaign: "not_set",
        utm_content: "not_set",
        utm_term: "not_set",
      });
    }
  });

  it("passes only approved custom properties and never user identity or authored text", () => {
    trackMvpFunnelStage("matpick", "reservation_completed", {
      creative_id: "creative-a",
      landing_variant: "hero-b",
      slot_key: "this-week",
      storage_mode: "supabase",
      submit_success: true,
      instagram_id: "private_handle",
      name: "Private Name",
      idea_text: "사용자가 입력한 아이디어 원문",
    } as never);

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events[0]).toMatchObject({
      product_id: "matpick",
      creative_id: "creative-a",
      landing_variant: "hero-b",
      slot_key: "this-week",
      storage_mode: "supabase",
      submit_success: true,
    });
    expect(events[0]).not.toHaveProperty("instagram_id");
    expect(events[0]).not.toHaveProperty("name");
    expect(events[0]).not.toHaveProperty("idea_text");
    expect(JSON.stringify(events)).not.toContain("private_handle");
    expect(JSON.stringify(events)).not.toContain("아이디어 원문");
  });

  it("keeps non-funnel result and deep actions out of reservation_completed", () => {
    trackMvpResultViewed("tastepin");
    trackMvpDeepAction("today_b");
    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events.map((entry) => entry.event)).toEqual([
      MVP_DEFINITIONS.tastepin.events.result,
      MVP_DEFINITIONS.today_b.events.deepAction,
    ]);
    expect(events.some((entry) => entry.event === "reservation_completed")).toBe(false);
  });

  it("never records login or reservation completion for demo sessions", () => {
    const realSession = { authenticated: true as const, demo: false };
    const demoSession = { authenticated: true as const, demo: true };

    expect(trackMvpLoginCompleted("onebite", demoSession)).toBe(false);
    expect(trackMvpReservationCompleted("onebite", demoSession, {
      slot_key: "this-week",
      storage_mode: "local_demo",
      submit_success: true,
    })).toBe(false);
    expect(trackMvpReservationCompleted("onebite", realSession, {
      slot_key: "this-week",
      storage_mode: "local_demo",
      submit_success: true,
    })).toBe(false);
    expect(trackMvpReservationCompleted("onebite", realSession, {
      slot_key: "this-week",
      storage_mode: "supabase",
      submit_success: false,
    })).toBe(false);
    expect(trackMvpReservationCompleted("onebite", realSession, {
      slot_key: "this-week",
      storage_mode: "supabase",
      submit_success: true,
    })).toBe(true);

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events.map((event) => event.event)).toEqual(["reservation_completed"]);
  });

  it("records attributed signup only after matching real auth", () => {
    const realSession = { authenticated: true as const, demo: false };
    const demoSession = { authenticated: true as const, demo: true };
    expect(trackMvpSignupCompleted("onebite", realSession)).toBe(false);
    markMvpSignupPending("onebite");
    expect(trackMvpSignupCompleted("onebite", demoSession)).toBe(false);
    expect(trackMvpSignupCompleted("tastepin", realSession)).toBe(false);
    expect(trackMvpSignupCompleted("onebite", realSession)).toBe(true);
    expect(trackMvpSignupCompleted("onebite", realSession)).toBe(false);

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events).toEqual([
      expect.objectContaining({ event: "login_completed", product_id: "onebite" }),
    ]);
  });
});
