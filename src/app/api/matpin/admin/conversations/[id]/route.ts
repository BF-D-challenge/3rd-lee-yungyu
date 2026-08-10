import { getMatpinAdminAccess } from "@/lib/matpin/admin-auth";
import { matpinAdminAccessError, matpinAdminJson, matpinAdminOperationError } from "@/lib/matpin/admin-http";
import { readMatpinAdminConversation } from "@/lib/matpin/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await getMatpinAdminAccess();
  if (access.state !== "authorized") return matpinAdminAccessError(access);
  const { id } = await context.params;
  try {
    return matpinAdminJson(await readMatpinAdminConversation(id));
  } catch (error) {
    return matpinAdminOperationError(error);
  }
}
