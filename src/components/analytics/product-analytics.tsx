"use client";

import { usePathname } from "next/navigation";
import { Clarity } from "@/components/analytics/clarity";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { shouldLoadProductAnalytics } from "@/components/analytics/analytics-path";

type ProductAnalyticsProps = {
  clarityProjectId?: string;
  googleMeasurementId?: string;
  metaPixelId?: string;
};

export function ProductAnalytics({
  clarityProjectId,
  googleMeasurementId,
  metaPixelId,
}: ProductAnalyticsProps) {
  const pathname = usePathname();

  if (!shouldLoadProductAnalytics(pathname)) return null;

  return (
    <>
      <GoogleAnalytics measurementId={googleMeasurementId} />
      <Clarity projectId={clarityProjectId} />
      <MetaPixel pixelId={metaPixelId} />
    </>
  );
}
