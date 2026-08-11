import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatpinAdmin } from "@/components/organisms/tastepin/matpin-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "운영 CRM E2E | 맛핀",
  robots: { index: false, follow: false },
};

export default function MatpinAdminE2EPage() {
  if (process.env.NEXT_PUBLIC_E2E !== "1") notFound();

  return <MatpinAdmin accessState="authorized" email="e2e-admin@matpin.test" />;
}
