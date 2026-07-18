import Script from "next/script";

const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  if (!measurementId || !GA_MEASUREMENT_ID.test(measurementId)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(measurementId)});
        `}
      </Script>
    </>
  );
}
