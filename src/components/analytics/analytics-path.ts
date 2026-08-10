const MATPIN_ADMIN_PATH = "/matpin/admin";

export function isMatpinAdminPath(pathname: string | null): boolean {
  if (!pathname) return false;

  return pathname === MATPIN_ADMIN_PATH || pathname.startsWith(`${MATPIN_ADMIN_PATH}/`);
}

/**
 * OAuth completion starts on an analytics-enabled route. A client transition
 * from there would keep already-created third-party globals alive, even though
 * the private CRM does not render their script tags. Only a verified
 * same-origin admin destination may opt into a full-document replacement.
 */
export function isSameOriginMatpinAdminDestination(
  destination: string,
  currentOrigin: string,
): boolean {
  try {
    const origin = new URL(currentOrigin);
    const target = new URL(destination, origin);
    return target.origin === origin.origin && isMatpinAdminPath(target.pathname);
  } catch {
    return false;
  }
}

/**
 * The operations CRM contains private Instagram conversation data. Keep every
 * third-party product analytics and sharing SDK script out of that route and
 * its subroutes.
 */
export function shouldLoadProductAnalytics(pathname: string | null): boolean {
  return Boolean(pathname) && !isMatpinAdminPath(pathname);
}
