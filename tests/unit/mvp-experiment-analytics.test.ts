import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MVP_DEFINITIONS,
  markMvpSignupPending,
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
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
  vi.stubGlobal("window", { location: { pathname: "/today-a", search: "" } });
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
});

describe("5개 MVP 독립 계측", () => {
  it("records the five isolated funnel contracts without user content", () => {
    const experimentIds = ["tastepin", "onebite", "today_a", "today_b", "story_cards"] as const;
    for (const experimentId of experimentIds) {
      trackMvpLandingViewed(experimentId);
      trackMvpInputStarted(experimentId);
      trackMvpResultViewed(experimentId);
      trackMvpDeepAction(experimentId);
    }
    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events.map((entry) => entry.event)).toEqual([
      "tastepin_landing_viewed",
      "tastepin_input_started",
      "tastepin_result_viewed",
      "tastepin_place_followup_opened",
      "onebite_landing_viewed",
      "onebite_input_started",
      "onebite_result_viewed",
      "onebite_next_meal_commit_saved",
      "today_a_landing_viewed",
      "today_a_input_started",
      "today_a_result_viewed",
      "today_a_structure_saved",
      "today_b_landing_viewed",
      "today_b_input_started",
      "today_b_result_viewed",
      "today_b_experiment_started",
      "story_cards_landing_viewed",
      "story_cards_input_started",
      "story_cards_result_viewed",
      "story_cards_regeneration_completed",
    ]);
    expect(new Set(events.map((entry) => entry.experiment_id))).toEqual(new Set(experimentIds));
    for (const event of events) {
      const productId = event.product_id as keyof typeof MVP_DEFINITIONS;
      expect(event).toMatchObject({
        product_slug: MVP_DEFINITIONS[productId].productSlug,
        product_path: MVP_DEFINITIONS[productId].path,
        page_path: "/today-a",
        session_id: "session-1",
        source: "direct",
        utm_source: "not_set",
        utm_medium: "not_set",
        utm_campaign: "not_set",
        utm_content: "not_set",
        utm_term: "not_set",
      });
      expect(event.event_id).toEqual(expect.any(String));
      expect(event.occurred_at).toEqual(expect.any(String));
    }
    expect(JSON.stringify(events)).not.toContain("url");
    expect(JSON.stringify(events)).not.toContain("text");
  });

  it("records signup only after matching real auth and never for demo auth", () => {
    const realSession = { authenticated: true as const, demo: false };
    const demoSession = { authenticated: true as const, demo: true };
    expect(trackMvpSignupCompleted("onebite", realSession)).toBe(false);
    markMvpSignupPending("onebite");
    expect(trackMvpSignupCompleted("onebite", demoSession)).toBe(false);
    expect(trackMvpSignupCompleted("tastepin", realSession)).toBe(false);
    expect(trackMvpSignupCompleted("onebite", realSession)).toBe(true);
    expect(trackMvpSignupCompleted("onebite", realSession)).toBe(false);

    markMvpSignupPending("onebite");
    expect(trackMvpSignupCompleted("onebite", demoSession)).toBe(false);

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events.filter((event) => event.event === "onebite_signup_completed")).toEqual([
      expect.objectContaining({
        experiment_id: "onebite",
        product_id: "onebite",
        product_slug: "onebite",
      }),
    ]);
  });
});
