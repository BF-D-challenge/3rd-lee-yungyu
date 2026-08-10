import { getMatpinAdminAccess } from "@/lib/matpin/admin-auth";
import { matpinAdminRangeSchema } from "@/lib/matpin/admin-contract";
import { matpinAdminAccessError, matpinAdminJson, matpinAdminOperationError } from "@/lib/matpin/admin-http";
import { readMatpinAdminDashboardSummary } from "@/lib/matpin/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getMatpinAdminAccess();
  if (access.state !== "authorized") return matpinAdminAccessError(access);
  const search = new URL(request.url).searchParams;
  const range = matpinAdminRangeSchema.safeParse(search.get("range") ?? "24h");
  if (!range.success) return matpinAdminJson({ error: "invalid_range" }, { status: 400 });
  const instagram = search.get("instagram");
  if (instagram !== null && instagram !== "0" && instagram !== "1") {
    return matpinAdminJson({ error: "invalid_instagram_mode" }, { status: 400 });
  }
  try {
    return matpinAdminJson(await readMatpinAdminDashboardSummary(range.data, instagram !== "0"));
  } catch (error) {
    return matpinAdminOperationError(error);
  }
}
