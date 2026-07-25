"use client";

import Script from "next/script";
import { trackMetaPageView } from "@/lib/meta-conversions";

const META_PIXEL_ID = /^\d{5,20}$/;

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  if (!pixelId || !META_PIXEL_ID.test(pixelId)) return null;

  return (
    <>
      <Script
        id="meta-pixel-bootstrap"
        strategy="afterInteractive"
        onReady={trackMetaPageView}
      >
        {`
          !function(f,b,e,v,n,t,s){
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
            s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
          }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          window.__metaPixelConfigured = true;
          fbq('init', ${JSON.stringify(pixelId)});
        `}
      </Script>
    </>
  );
}
