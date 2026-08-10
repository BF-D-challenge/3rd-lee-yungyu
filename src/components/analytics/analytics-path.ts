/**
 * The operations CRM contains private Instagram conversation data. Keep every
 * third-party product analytics and sharing SDK script out of that route and
 * its subroutes.
 */
export function shouldLoadProductAnalytics(pathname: string | null): boolean {
  if (!pathname) return false;

  return pathname !== "/matpin/admin" && !pathname.startsWith("/matpin/admin/");
}
