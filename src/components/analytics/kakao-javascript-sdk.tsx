"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { shouldLoadProductAnalytics } from "@/components/analytics/analytics-path";
import {
  KAKAO_JAVASCRIPT_SDK_INTEGRITY,
  KAKAO_JAVASCRIPT_SDK_URL,
} from "@/lib/kakao-share";

export function KakaoJavascriptSdk({ javascriptKey }: { javascriptKey?: string }) {
  const pathname = usePathname();

  if (!javascriptKey || !shouldLoadProductAnalytics(pathname)) return null;

  return (
    <Script
      id="kakao-javascript-sdk"
      src={KAKAO_JAVASCRIPT_SDK_URL}
      integrity={KAKAO_JAVASCRIPT_SDK_INTEGRITY}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
