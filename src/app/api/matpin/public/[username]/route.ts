import { NextResponse } from "next/server";
import { MatpinConfigurationError } from "@/lib/matpin/security";
import { matpinPublicProfileResponse } from "@/lib/matpin/public-profile";
import { readMatpinPublicProfile } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  try {
    const profile = await readMatpinPublicProfile(username);
    if (!profile) return NextResponse.json({ error: "not_found" }, { status: 404, headers });
    return NextResponse.json(matpinPublicProfileResponse(profile), { headers });
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json(
      { error: status === 503 ? "not_configured" : "read_failed" },
      { status, headers: { ...headers, "cache-control": "no-store" } },
    );
  }
}
