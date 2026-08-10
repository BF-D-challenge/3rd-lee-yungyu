import { getMatpinAdminAccess } from "@/lib/matpin/admin-auth";
import { matpinAdminFilterSchema } from "@/lib/matpin/admin-contract";
import { matpinAdminAccessError, matpinAdminJson, matpinAdminOperationError } from "@/lib/matpin/admin-http";
import { listMatpinAdminConversations } from "@/lib/matpin/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getMatpinAdminAccess();
  if (access.state !== "authorized") return matpinAdminAccessError(access);
  const search = new URL(request.url).searchParams;
  const filter = matpinAdminFilterSchema.safeParse(search.get("filter") ?? "all");
  if (!filter.success) return matpinAdminJson({ error: "invalid_filter" }, { status: 400 });
  try {
    return matpinAdminJson(await listMatpinAdminConversations({
      filter: filter.data,
      after: search.get("after"),
    }));
  } catch (error) {
    return matpinAdminOperationError(error);
  }
}
