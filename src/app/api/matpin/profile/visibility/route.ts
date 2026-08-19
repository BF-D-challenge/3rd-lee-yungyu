import { NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedAuthUser, hasTrustedMutationOrigin } from "@/lib/backend/server-auth";
import { bearerToken, MatpinConfigurationError } from "@/lib/matpin/security";
import { disableMatpinPublicProfile } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ isPublic: z.literal(false) });

export async function PATCH(request: Request) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "cross_origin_forbidden" }, { status: 403 });
  }
  const user = await getVerifiedAuthUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "private_link_required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!requestSchema.safeParse(body).success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const disabled = await disableMatpinPublicProfile(token, user.id);
    if (!disabled) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(
      { ok: true, isPublic: false },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json(
      { error: status === 503 ? "not_configured" : "update_failed" },
      { status, headers: { "cache-control": "private, no-store" } },
    );
  }
}
