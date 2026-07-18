import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackIdeaEvent, trackIdeaFunnelEvent } from "../../src/lib/track";

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
  vi.stubGlobal("window", { location: { pathname: "/" } });
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
    });
    expect(JSON.stringify(events[0])).not.toContain("message");
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
