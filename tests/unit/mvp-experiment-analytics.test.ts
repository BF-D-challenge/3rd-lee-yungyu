import { beforeEach, describe, expect, it, vi } from "vitest";
import { markMvpSignupPending, trackMvpDeepAction, trackMvpResultViewed, trackMvpSignupCompleted } from "../../src/lib/mvp-experiment-analytics";

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
  vi.stubGlobal("window", { location: { pathname: "/today-a" } });
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
});

describe("5개 MVP 독립 계측", () => {
  it("records distinct result and deep-action events without user content", () => {
    const experimentIds = ["tastepin", "onebite", "today_a", "today_b", "random_ending"] as const;
    for (const experimentId of experimentIds) {
      trackMvpResultViewed(experimentId);
      trackMvpDeepAction(experimentId);
    }
    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events.map((entry) => entry.event)).toEqual([
      "tastepin_result_viewed",
      "tastepin_second_source_submitted",
      "onebite_result_viewed",
      "onebite_next_meal_commit_saved",
      "today_a_result_viewed",
      "today_a_structure_saved",
      "today_b_result_viewed",
      "today_b_experiment_started",
      "random_ending_viewed",
      "random_ending_redraw_started",
    ]);
    expect(new Set(events.map((entry) => entry.experiment_id))).toEqual(new Set(experimentIds));
    expect(JSON.stringify(events)).not.toContain("url");
    expect(JSON.stringify(events)).not.toContain("text");
  });

  it("records signup only after the matching result CTA has completed auth", () => {
    expect(trackMvpSignupCompleted("onebite")).toBe(false);
    markMvpSignupPending("onebite");
    expect(trackMvpSignupCompleted("tastepin")).toBe(false);
    expect(trackMvpSignupCompleted("onebite")).toBe(true);
    expect(trackMvpSignupCompleted("onebite")).toBe(false);

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: "onebite_signup_completed", experiment_id: "onebite" }),
    ]));
  });
});
