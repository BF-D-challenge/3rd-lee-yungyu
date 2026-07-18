import { PraiseRequestReceiver } from "@/components/organisms/praise-request/praise-request-receiver";

export default async function PraiseRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PraiseRequestReceiver slug={slug} />;
}
