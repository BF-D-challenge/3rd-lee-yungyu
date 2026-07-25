import { track } from "./track";

export type MvpExperimentId = "tastepin" | "onebite" | "today_a" | "today_b" | "random_ending";

const resultEvent: Record<MvpExperimentId, string> = {
  tastepin: "tastepin_result_viewed",
  onebite: "onebite_result_viewed",
  today_a: "today_a_result_viewed",
  today_b: "today_b_result_viewed",
  random_ending: "random_ending_viewed",
};

const deepActionEvent = {
  tastepin: "tastepin_second_source_submitted",
  onebite: "onebite_next_meal_commit_saved",
  today_a: "today_a_structure_saved",
  today_b: "today_b_experiment_started",
  random_ending: "random_ending_redraw_started",
} as const;

const signupCompletedEvent = {
  tastepin: "tastepin_signup_completed",
  onebite: "onebite_signup_completed",
  today_a: "today_a_signup_completed",
  today_b: "today_b_signup_completed",
  random_ending: "random_ending_signup_completed",
} as const;

const SIGNUP_PENDING_KEY = "mvp:signup-pending:v1";
const SIGNUP_PENDING_TTL_MS = 10 * 60 * 1_000;

/** Only fixed experiment IDs and event names enter analytics; source URLs, images, and user text do not. */
export function trackMvpResultViewed(experimentId: MvpExperimentId): void {
  const event = resultEvent[experimentId];
  track(event, { event_type: event, experiment_id: experimentId });
}

export function trackMvpDeepAction(experimentId: MvpExperimentId): void {
  const event = deepActionEvent[experimentId];
  track(event, { event_type: event, experiment_id: experimentId });
}

/** Attribute an auth completion only to the result CTA that initiated it. */
export function markMvpSignupPending(experimentId: MvpExperimentId): void {
  try {
    sessionStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify({ experimentId, at: Date.now() }));
  } catch {
    // Auth itself remains available when session storage is blocked.
  }
}

/** Returns false for existing sessions, expired attribution, or another product's CTA. */
export function trackMvpSignupCompleted(experimentId: MvpExperimentId): boolean {
  try {
    const raw = sessionStorage.getItem(SIGNUP_PENDING_KEY);
    const pending = raw ? JSON.parse(raw) as { experimentId?: unknown; at?: unknown } : null;
    const valid = pending?.experimentId === experimentId
      && typeof pending.at === "number"
      && Date.now() - pending.at >= 0
      && Date.now() - pending.at <= SIGNUP_PENDING_TTL_MS;
    if (!valid) return false;
    sessionStorage.removeItem(SIGNUP_PENDING_KEY);
  } catch {
    return false;
  }
  const event = signupCompletedEvent[experimentId];
  track(event, { event_type: event, experiment_id: experimentId });
  return true;
}
