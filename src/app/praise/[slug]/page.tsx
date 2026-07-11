import { PraiseRequestReceiver } from "@/components/organisms/praise-request/praise-request-receiver";

export default function PraiseRequestPage({ params }: { params: { slug: string } }) {
  return <PraiseRequestReceiver slug={params.slug} />;
}
