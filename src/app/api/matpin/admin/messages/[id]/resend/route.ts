import { getMatpinAdminAccess } from "@/lib/matpin/admin-auth";
import { matpinAdminResendSchema } from "@/lib/matpin/admin-contract";
import { matpinAdminAccessError, matpinAdminJson, matpinAdminOperationError } from "@/lib/matpin/admin-http";
import { resendMatpinAdminLibrary } from "@/lib/matpin/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Two 8-second Meta guard reads plus one 8-second send need room for DB preparation and audit writes.
export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await getMatpinAdminAccess();
  if (access.state !== "authorized") return matpinAdminAccessError(access);
  const body = matpinAdminResendSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return matpinAdminJson({ error: "invalid_request" }, { status: 400 });
  const { id } = await context.params;
  try {
    return matpinAdminJson({ ok: true, result: await resendMatpinAdminLibrary({
      user: access.user,
      messageId: id,
      conversationId: body.data.conversationId,
      idempotencyKey: body.data.idempotencyKey,
    }) });
  } catch (error) {
    return matpinAdminOperationError(error);
  }
}
