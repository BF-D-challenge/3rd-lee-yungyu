import Script from "next/script";

const CLARITY_PROJECT_ID = /^[a-z0-9]{10}$/;

export function Clarity({ projectId }: { projectId?: string }) {
  if (!projectId || !CLARITY_PROJECT_ID.test(projectId)) return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script",${JSON.stringify(projectId)});
      `}
    </Script>
  );
}
