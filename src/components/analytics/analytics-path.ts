const MATPIN_ADMIN_PATH = "/matpin/admin";
const PUBLIC_MATPIN_PROFILE_PATH = /^\/(?:@[a-z0-9._]{1,30}|matpin\/(?:public|saved)\/[a-z0-9._]{1,30})\/?$/i;
const PRIVATE_MATPIN_TOKEN_PATH = /^\/matpin\/(?:saved|delete|confirm|station\/[^/]+|reel\/[^/]+)\/?$/i;

export function isMatpinAdminPath(pathname: string | null): boolean {
  if (!pathname) return false;

  return pathname === MATPIN_ADMIN_PATH || pathname.startsWith(`${MATPIN_ADMIN_PATH}/`);
}

export function isPublicMatpinProfilePath(pathname: string): boolean {
  return PUBLIC_MATPIN_PROFILE_PATH.test(pathname);
}

export function isPrivateMatpinTokenPath(pathname: string): boolean {
  return PRIVATE_MATPIN_TOKEN_PATH.test(pathname);
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
  return Boolean(pathname)
    && !isMatpinAdminPath(pathname)
    && !isPublicMatpinProfilePath(pathname as string)
    && !isPrivateMatpinTokenPath(pathname as string);
}
