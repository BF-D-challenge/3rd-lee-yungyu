import { track } from "./track";

export type MvpExperimentId = "tastepin" | "onebite" | "today_a" | "today_b" | "story_cards";

type MvpDefinition = {
  productSlug: string;
  path: string;
  events: {
    landing: string;
    input: string;
    result: string;
    deepAction: string;
    signup: string;
  };
};

export const MVP_DEFINITIONS: Record<MvpExperimentId, MvpDefinition> = {
  tastepin: {
    productSlug: "tastepin",
    path: "/tastepin",
    events: {
      landing: "tastepin_landing_viewed",
      input: "tastepin_input_started",
      result: "tastepin_result_viewed",
      deepAction: "tastepin_place_followup_opened",
      signup: "tastepin_signup_completed",
    },
  },
  onebite: {
    productSlug: "onebite",
    path: "/onebite",
    events: {
      landing: "onebite_landing_viewed",
      input: "onebite_input_started",
      result: "onebite_result_viewed",
      deepAction: "onebite_next_meal_commit_saved",
      signup: "onebite_signup_completed",
    },
  },
  today_a: {
    productSlug: "today-a",
    path: "/today-a",
    events: {
      landing: "today_a_landing_viewed",
      input: "today_a_input_started",
      result: "today_a_result_viewed",
      deepAction: "today_a_structure_saved",
      signup: "today_a_signup_completed",
    },
  },
  today_b: {
    productSlug: "today-b",
    path: "/today-b",
    events: {
      landing: "today_b_landing_viewed",
      input: "today_b_input_started",
      result: "today_b_result_viewed",
      deepAction: "today_b_experiment_started",
      signup: "today_b_signup_completed",
    },
  },
  story_cards: {
    productSlug: "story-cards",
    path: "/story-cards",
    events: {
      landing: "story_cards_landing_viewed",
      input: "story_cards_input_started",
      result: "story_cards_result_viewed",
      deepAction: "story_cards_regeneration_completed",
      signup: "story_cards_signup_completed",
    },
  },
};

const SIGNUP_PENDING_KEY = "mvp:signup-pending:v1";
const SIGNUP_PENDING_TTL_MS = 10 * 60 * 1_000;

function trackMvpStage(
  experimentId: MvpExperimentId,
  stage: "landing" | "input" | "result" | "deepAction" | "signup",
): void {
  const definition = MVP_DEFINITIONS[experimentId];
  const event = definition.events[stage];
  track(event, {
    event_type: event,
    funnel_stage: stage === "deepAction" ? "deep_action" : stage,
    product_id: experimentId,
    product_slug: definition.productSlug,
    product_path: definition.path,
    experiment_id: experimentId,
  });
}

/** Only fixed product IDs and event names enter analytics; source URLs, images, and user text do not. */
export function trackMvpLandingViewed(experimentId: MvpExperimentId): void {
  trackMvpStage(experimentId, "landing");
}

export function trackMvpInputStarted(experimentId: MvpExperimentId): void {
  trackMvpStage(experimentId, "input");
}

export function trackMvpResultViewed(experimentId: MvpExperimentId): void {
  trackMvpStage(experimentId, "result");
}

export function trackMvpDeepAction(experimentId: MvpExperimentId): void {
  trackMvpStage(experimentId, "deepAction");
}

/** Attribute an auth completion only to the result CTA that initiated it. */
export function markMvpSignupPending(experimentId: MvpExperimentId): void {
  try {
    sessionStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify({ experimentId, at: Date.now() }));
  } catch {
    // Auth itself remains available when session storage is blocked.
  }
}

/** Returns false for demos, existing sessions, expired attribution, or another product's CTA. */
export function trackMvpSignupCompleted(
  experimentId: MvpExperimentId,
  session: { authenticated: true; demo: boolean },
): boolean {
  if (session.demo) return false;
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
  trackMvpStage(experimentId, "signup");
  return true;
}
