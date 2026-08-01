import { NextResponse } from "next/server";
import {
  todayApplicationRequestSchema,
} from "@/lib/today-contract";
import {
  enqueueTodayApplication,
  TodayDeliveryConfigurationError,
} from "@/lib/today-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = todayApplicationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await enqueueTodayApplication(parsed.data);
    return NextResponse.json(
      { mode: "server_queue", ...result },
      { status: 202, headers: { "cache-control": "no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof TodayDeliveryConfigurationError) {
      return NextResponse.json(
        {
          error: "delivery_unavailable",
          notice: "서버 작업 큐와 이메일 설정이 아직 연결되지 않았어요.",
        },
        { status: 503 },
      );
    }
    console.error("today application enqueue failed", error);
    return NextResponse.json(
      { error: "delivery_failed", notice: "제작 신청을 접수하지 못했어요. 잠시 뒤 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
