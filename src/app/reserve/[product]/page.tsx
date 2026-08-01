import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationPage } from "@/components/organisms/reservation/reservation-page";
import {
  fakeDoorProductConfigs,
  fakeDoorProductSchema,
} from "@/lib/fake-door-reservation-contract";

type ReservationRouteProps = {
  params: Promise<{ product: string }>;
};

export function generateStaticParams() {
  return Object.keys(fakeDoorProductConfigs).map((product) => ({ product }));
}

export async function generateMetadata({
  params,
}: ReservationRouteProps): Promise<Metadata> {
  const result = fakeDoorProductSchema.safeParse((await params).product);
  if (!result.success) return {};
  const config = fakeDoorProductConfigs[result.data];
  return {
    title: `${config.name} 초기 체험 예약`,
    description: config.description,
  };
}

export default async function ReservationRoute({
  params,
}: ReservationRouteProps) {
  const result = fakeDoorProductSchema.safeParse((await params).product);
  if (!result.success) notFound();
  return <ReservationPage config={fakeDoorProductConfigs[result.data]} />;
}
