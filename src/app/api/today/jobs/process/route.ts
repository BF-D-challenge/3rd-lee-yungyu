import { NextResponse } from "next/server";
import { z } from "zod";
import { buildTodayArtifacts } from "@/lib/today-artifacts";
import { todayIdeaResultSchema, todayChannelSchema, todaySignalSchema } from "@/lib/today-contract";
import {
  createTodayAccessToken,
  getTodayServerClient,
  TodayDeliveryConfigurationError,
} from "@/lib/today-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const claimedJobSchema = z.object({
  skipped: z.boolean().optional(),
  messageId: z.number().int().optional(),
  job: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    idea: todayIdeaResultSchema,
    channel: todayChannelSchema,
    signal: todaySignalSchema,
  }).optional(),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendResultEmail(input: {
  email: string;
  title: string;
  resultUrl: string;
  jobId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.TODAY_FROM_EMAIL?.trim();
  if (!apiKey || !from) throw new TodayDeliveryConfigurationError();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": `today-result/${input.jobId}`,
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: `[Today] ${input.title} 테스트 결과가 준비됐어요`,
      html: `
        <div style="margin:0 auto;max-width:560px;padding:32px 20px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#15171d">
          <p style="margin:0 0 12px;color:#244bdb;font-size:12px;font-weight:800;letter-spacing:.08em">TODAY · 1일 제작 결과</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.3">${escapeHtml(input.title)}</h1>
          <p style="margin:0 0 24px;color:#606775;font-size:16px;line-height:1.7">광고 이미지, 가짜문 랜딩, 측정 기준을 한곳에 준비했어요.</p>
          <a href="${escapeHtml(input.resultUrl)}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#244bdb;color:#fff;font-weight:800;text-decoration:none">내 제작 결과 열기</a>
          <p style="margin:24px 0 0;color:#7b8290;font-size:12px;line-height:1.6">이 링크는 신청자 전용입니다. 다른 사람에게 전달하지 마세요.</p>
        </div>
      `,
    }),
  });

  const body = await response.json() as { id?: string; message?: string };
  if (!response.ok || !body.id) {
    throw new Error(`resend_failed:${body.message ?? response.status}`);
  }
  return body.id;
}

async function processOne() {
  const client = getTodayServerClient();
  const { data, error } = await client.rpc("today_claim_next_job");
  if (error) throw new Error(`today_claim_failed:${error.message}`);
  if (!data) return { state: "empty" as const };

  const claimed = claimedJobSchema.parse(data);
  if (claimed.skipped || !claimed.job || !claimed.messageId) {
    return { state: "skipped" as const };
  }

  const { job, messageId } = claimed;
  try {
    const artifacts = buildTodayArtifacts(job.idea, job.channel, job.signal);
    const token = createTodayAccessToken(job.id);
    const siteUrl = process.env.TODAY_PUBLIC_APP_URL?.trim();
    if (!siteUrl) throw new TodayDeliveryConfigurationError();
    const resultUrl = new URL(`/today#job=${job.id}&token=${encodeURIComponent(token)}`, siteUrl).toString();
    const emailId = await sendResultEmail({
      email: job.email,
      title: job.idea.title,
      resultUrl,
      jobId: job.id,
    });
    const completion = await client.rpc("today_complete_job", {
      p_job_id: job.id,
      p_message_id: messageId,
      p_artifacts: artifacts,
      p_resend_email_id: emailId,
    });
    if (completion.error) throw new Error(`today_complete_failed:${completion.error.message}`);
    return { state: "completed" as const, jobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_delivery_error";
    await client.rpc("today_retry_job", { p_job_id: job.id, p_error: message });
    throw error;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const processed = [];
    for (let index = 0; index < 5; index += 1) {
      const result = await processOne();
      processed.push(result);
      if (result.state === "empty") break;
    }
    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    if (error instanceof TodayDeliveryConfigurationError) {
      return NextResponse.json({ error: "delivery_unavailable" }, { status: 503 });
    }
    console.error("today worker failed", error);
    return NextResponse.json({ error: "worker_failed" }, { status: 502 });
  }
}
