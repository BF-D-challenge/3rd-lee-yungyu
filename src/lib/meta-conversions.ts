"use client";

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    __metaPixelConfigured?: boolean;
  }
}

export type MetaConversion = {
  eventName:
    | "PageView"
    | "ViewContent"
    | "CompleteRegistration"
    | "IdeaSelected"
    | "FirstActionPlanStarted"
    | "MvpDeepAction";
  standard: boolean;
  params: Record<string, string | number | string[]>;
};

const META_EVENT_ENDPOINT = "/api/meta/events";

const safeString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 && value.length <= 120
    ? value
    : undefined;

const safeAttempt = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 1000
    ? value
    : undefined;

const mvpResultEvents = new Set([
  "tastepin_result_viewed",
  "onebite_result_viewed",
  "today_a_result_viewed",
  "today_b_result_viewed",
  "random_ending_viewed",
]);

const mvpDeepActionEvents = new Set([
  "tastepin_second_source_submitted",
  "onebite_next_meal_commit_saved",
  "today_a_structure_saved",
  "today_b_experiment_started",
  "random_ending_redraw_started",
]);

const mvpSignupEvents = new Set([
  "tastepin_signup_completed",
  "onebite_signup_completed",
  "today_a_signup_completed",
  "today_b_signup_completed",
  "random_ending_signup_completed",
]);

/** 내부 분석 이벤트를 광고 전환용 최소 필드로만 변환한다. 사용자 작성 문구는 전달하지 않는다. */
export function metaConversionForEvent(
  event: string,
  params: Record<string, unknown> = {},
): MetaConversion | null {
  const scenarioId = safeString(params.scenario_id);
  const attempt = safeAttempt(params.attempt);
  const experimentId = safeString(params.experiment_id);
  const common = {
    content_category: "idea_funnel",
    ...(scenarioId ? { scenario_id: scenarioId } : {}),
    ...(attempt ? { attempt } : {}),
  };

  if (experimentId && mvpResultEvents.has(event)) {
    return {
      eventName: "ViewContent",
      standard: true,
      params: {
        content_category: "mvp_experiment",
        content_name: experimentId,
        content_type: "product",
        content_ids: [experimentId],
        experiment_id: experimentId,
      },
    };
  }

  if (experimentId && mvpDeepActionEvents.has(event)) {
    return {
      eventName: "MvpDeepAction",
      standard: false,
      params: {
        content_category: "mvp_experiment",
        experiment_id: experimentId,
        action_name: event,
      },
    };
  }

  if (experimentId && mvpSignupEvents.has(event)) {
    return {
      eventName: "CompleteRegistration",
      standard: true,
      params: {
        content_category: "mvp_experiment",
        content_name: experimentId,
        status: "completed",
        experiment_id: experimentId,
      },
    };
  }

  switch (event) {
    case "idea_result_viewed":
      return {
        eventName: "ViewContent",
        standard: true,
        params: {
          ...common,
          content_name: "idea_result",
          content_type: "product",
          ...(scenarioId ? { content_ids: [scenarioId] } : {}),
        },
      };
    case "idea_selected":
      return {
        eventName: "IdeaSelected",
        standard: false,
        params: common,
      };
    case "idea_first_action_started":
      return {
        eventName: "FirstActionPlanStarted",
        standard: false,
        params: {
          ...common,
          action_type: safeString(params.action_type) ?? "development_prompt_copy",
        },
      };
    default:
      return null;
  }
}

const createEventId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `meta-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

function emitMetaConversion(conversion: MetaConversion): void {
  if (typeof window === "undefined" || !window.__metaPixelConfigured || !window.fbq) return;

  const eventId = createEventId();
  const command = conversion.standard ? "track" : "trackCustom";
  window.fbq(command, conversion.eventName, conversion.params, { eventID: eventId });

  void fetch(META_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event_name: conversion.eventName,
      event_id: eventId,
      event_source_path: window.location.pathname,
      custom_data: conversion.params,
    }),
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // CAPI 실패가 제품 동작이나 기존 분석을 막아서는 안 된다.
  });
}

export function trackMetaPageView(): void {
  emitMetaConversion({
    eventName: "PageView",
    standard: true,
    params: { content_category: "landing_page" },
  });
}

export function trackMetaEvent(event: string, params: Record<string, unknown>): void {
  const conversion = metaConversionForEvent(event, params);
  if (conversion) emitMetaConversion(conversion);
}
