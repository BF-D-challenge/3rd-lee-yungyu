import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  track,
  trackIdeaEvent,
  trackIdeaFunnelEvent,
  trackIdeaFunnelEventOnce,
} from "../../src/lib/track";

const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
};

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("sessionStorage", makeStorage());
  vi.stubGlobal("crypto", { randomUUID: vi.fn()
    .mockReturnValueOnce("event-1")
    .mockReturnValueOnce("session-1")
    .mockReturnValue("event-next") });
  vi.stubGlobal("window", { location: { pathname: "/", search: "?utm_source=meta&utm_campaign=tastepin-launch&utm_content=creative-a" } });
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
});

describe("idea loop event tracking", () => {
  it("records the creation funnel without user-authored copy", () => {
    trackIdeaFunnelEvent("idea_first_card_drawn", {
      attempt: 1,
      draw_method: "manual",
    });

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events[0]).toMatchObject({
      event: "idea_first_card_drawn",
      event_type: "idea_first_card_drawn",
      entry_path: "/",
      attempt: 1,
      draw_method: "manual",
      event_id: "event-1",
      session_id: "session-1",
      page_path: "/",
      source: "meta",
      utm_source: "meta",
      utm_medium: "not_set",
      utm_campaign: "tastepin-launch",
      utm_content: "creative-a",
      utm_term: "not_set",
    });
    expect(JSON.stringify(events[0])).not.toContain("message");
  });

  it("forwards the fixed event name to Clarity when its runtime is configured", () => {
    const clarity = vi.fn();
    (window as typeof window & { clarity?: typeof clarity }).clarity = clarity;

    track("tastepin_result_viewed", {
      experiment_id: "tastepin",
    });

    expect(clarity).toHaveBeenCalledWith("event", "tastepin_result_viewed");
  });

  it("does not store the same request/version event twice", () => {
    trackIdeaEvent("idea_share_opened", {
      request_id: "request-1",
      origin_request_id: "request-1",
      version: 0,
      entry_path: "/praise/one",
    });
    trackIdeaEvent("idea_share_opened", {
      request_id: "request-1",
      origin_request_id: "request-1",
      version: 0,
      entry_path: "/praise/one",
    });

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{ event: string }>;
    expect(events.filter((event) => event.event === "idea_share_opened")).toHaveLength(1);
  });

  it("does not emit the same funnel state twice in one browser session", () => {
    expect(trackIdeaFunnelEventOnce("idea_result_ready", "combo-1", {
      scenario_id: "scenario-1",
    })).toBe(true);
    expect(trackIdeaFunnelEventOnce("idea_result_ready", "combo-1", {
      scenario_id: "scenario-1",
    })).toBe(false);

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{ event: string }>;
    expect(events.filter((event) => event.event === "idea_result_ready")).toHaveLength(1);
  });

  it("keeps revision events separate without storing message text", () => {
    trackIdeaEvent("idea_feedback_sent", {
      request_id: "revision-request",
      origin_request_id: "origin-request",
      revision_id: "revision-1",
      version: 1,
      entry_path: "/praise/revision",
    });

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events[0]).toMatchObject({
      event: "idea_feedback_sent",
      request_id: "revision-request",
      origin_request_id: "origin-request",
      revision_id: "revision-1",
      version: 1,
      entry_path: "/praise/revision",
    });
    expect(JSON.stringify(events[0])).not.toContain("message");
  });
});
