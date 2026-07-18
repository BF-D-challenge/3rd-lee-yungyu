const DEFAULT_PUBLIC_SITE_ORIGIN = "https://bfd-seven.vercel.app";

const isLocalHostname = (hostname: string): boolean =>
  hostname === "localhost" || hostname === "127.0.0.1";

/** 로컬에서 만든 수신자 경로도 실제 친구가 열 수 있는 배포 주소로 바꾼다. */
export function toPublicShareUrl(url: string): string {
  const currentUrl = new URL(url, window.location.origin);
  if (!isLocalHostname(currentUrl.hostname)) return currentUrl.toString();

  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_PUBLIC_SITE_ORIGIN;
  const publicOrigin = new URL(configuredOrigin);
  return new URL(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, publicOrigin)
    .toString();
}
