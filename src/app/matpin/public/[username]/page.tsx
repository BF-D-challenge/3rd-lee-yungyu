import { notFound, redirect } from "next/navigation";
import { normalizeInstagramHandle } from "@/lib/instagram-handle";

export default async function MatpinPublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const username = normalizeInstagramHandle((await params).username);
  if (!username) notFound();
  redirect(`/matpin/saved/${username}`);
}
