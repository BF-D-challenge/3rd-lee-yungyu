import type { Metadata } from "next";
import { MatpinAdmin } from "@/components/organisms/tastepin/matpin-admin";
import { getMatpinAdminAccess } from "@/lib/matpin/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "운영 CRM | 맛핀",
  robots: { index: false, follow: false },
};

export default async function MatpinAdminPage() {
  const access = await getMatpinAdminAccess();
  return (
    <MatpinAdmin
      accessState={access.state}
      email={access.state === "authorized"
        ? access.user.email ?? null
        : access.state === "forbidden"
          ? access.email
          : null}
    />
  );
}
