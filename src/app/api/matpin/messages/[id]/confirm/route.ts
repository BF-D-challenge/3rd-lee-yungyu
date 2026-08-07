import { NextResponse } from "next/server";
import { z } from "zod";
import { bearerToken, MatpinConfigurationError } from "@/lib/matpin/security";
import { readMatpinMessage, saveMatpinPlaces } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.union([
  z.object({ candidateId: z.string().trim().min(1).max(200) }),
  z.object({ candidateIds: z.array(z.string().trim().min(1).max(200)).min(1).max(3) }),
]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = bearerToken(request);
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!token || !body.success || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const result = await readMatpinMessage(id, token);
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (result.message.status !== "needs_confirmation" && result.message.status !== "saved") {
      return NextResponse.json({ error: "message_unavailable" }, { status: 409 });
    }
    const candidateIds = "candidateIds" in body.data ? body.data.candidateIds : [body.data.candidateId];
    const candidates = result.message.candidates.filter((item) => candidateIds.includes(item.id));
    if (candidates.length !== candidateIds.length) {
      return NextResponse.json({ error: "candidate_not_found" }, { status: 404 });
    }
    const savedCount = await saveMatpinPlaces({
      messageId: id,
      senderHash: result.senderHash,
      candidates,
      confirmationSource: "user_confirmation",
    });
    return NextResponse.json({ ok: true, savedCount }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "not_configured" : "confirm_failed" }, { status });
  }
}
