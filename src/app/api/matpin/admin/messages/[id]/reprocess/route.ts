import { after } from "next/server";
import { getMatpinAdminAccess } from "@/lib/matpin/admin-auth";
import { matpinAdminReprocessSchema } from "@/lib/matpin/admin-contract";
import { matpinAdminAccessError, matpinAdminJson, matpinAdminOperationError } from "@/lib/matpin/admin-http";
import { reprocessMatpinAdminMessage } from "@/lib/matpin/admin-service";
import { isMatpinPipelineLive } from "@/lib/matpin/pipeline-mode";
import { processMatpinQueue } from "@/lib/matpin/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await getMatpinAdminAccess();
  if (access.state !== "authorized") return matpinAdminAccessError(access);
  if (!isMatpinPipelineLive()) {
    return matpinAdminJson({ error: "pipeline_not_live" }, { status: 409 });
  }
  const body = matpinAdminReprocessSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return matpinAdminJson({ error: "invalid_request" }, { status: 400 });
  const { id } = await context.params;
  try {
    const result = await reprocessMatpinAdminMessage({
      user: access.user,
      messageId: id,
      conversationId: body.data.conversationId,
      idempotencyKey: body.data.idempotencyKey,
    });
    if ("accepted" in result && result.accepted) {
      after(async () => {
        try {
          await processMatpinQueue(3);
        } catch (error) {
          console.error(
            "[matpin-admin] background_reprocess_failed",
            error instanceof Error ? error.message.split(":", 1)[0] : "unknown_error",
          );
        }
      });
    }
    return matpinAdminJson({ ok: true, result }, { status: 202 });
  } catch (error) {
    return matpinAdminOperationError(error);
  }
}
