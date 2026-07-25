import { NextRequest, NextResponse } from "next/server";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "IdeaSelected",
  "FirstActionPlanStarted",
]);
const ALLOWED_CUSTOM_DATA = new Set([
  "action_type",
  "attempt",
  "content_category",
  "content_ids",
  "content_name",
  "content_type",
  "scenario_id",
]);
const SAFE_ID = /^[A-Za-z0-9._:-]{1,120}$/;
const SAFE_PATH = /^\/[^\s]{0,500}$/;
const SAFE_GRAPH_VERSION = /^v\d{1,2}\.\d$/;

type ClientEvent = {
  event_name?: unknown;
  event_id?: unknown;
  event_source_path?: unknown;
  custom_data?: unknown;
};

function sanitizedCustomData(value: unknown): Record<string, string | number | string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string | number | string[]> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!ALLOWED_CUSTOM_DATA.has(key)) continue;
    if (typeof item === "string" && item.length <= 120) result[key] = item;
    if (typeof item === "number" && Number.isFinite(item)) result[key] = item;
    if (
      Array.isArray(item)
      && item.length <= 10
      && item.every((entry) => typeof entry === "string" && entry.length <= 120)
    ) {
      result[key] = item;
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  const datasetId = process.env.META_DATASET_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!datasetId || !/^\d{5,20}$/.test(datasetId) || !accessToken) {
    return new NextResponse(null, { status: 204 });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "cross_site_request" }, { status: 403 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 8192) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: ClientEvent;
  try {
    body = JSON.parse(rawBody) as ClientEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.event_name !== "string"
    || !ALLOWED_EVENTS.has(body.event_name)
    || typeof body.event_id !== "string"
    || !SAFE_ID.test(body.event_id)
    || typeof body.event_source_path !== "string"
    || !SAFE_PATH.test(body.event_source_path)
  ) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const graphVersion = SAFE_GRAPH_VERSION.test(process.env.META_GRAPH_API_VERSION ?? "")
    ? process.env.META_GRAPH_API_VERSION!
    : "v25.0";
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent");
  const fbp = request.cookies.get("_fbp")?.value;
  const fbc = request.cookies.get("_fbc")?.value;
  const userData = {
    ...(forwardedFor ? { client_ip_address: forwardedFor } : {}),
    ...(userAgent ? { client_user_agent: userAgent } : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${datasetId}/events`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          data: [{
            event_name: body.event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_id: body.event_id,
            event_source_url: new URL(body.event_source_path, request.nextUrl.origin).toString(),
            action_source: "website",
            user_data: userData,
            custom_data: sanitizedCustomData(body.custom_data),
          }],
        }),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return NextResponse.json({ error: "meta_upstream_error" }, { status: 502 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "meta_unavailable" }, { status: 502 });
  }
}
