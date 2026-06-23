import type { NextConfig } from "next";

const legacyRedirects = [
  ["/login.php", "/login"],
  ["/dashboard.php", "/dashboard"],
  ["/modules/calendar/index.php", "/calendar"],
  ["/modules/tickets/index.php", "/tickets"],
  ["/modules/tickets/create.php", "/tickets/new"],
  ["/modules/service_request/index.php", "/service-requests"],
  ["/modules/access_request/index.php", "/access-requests"],
  ["/modules/pm_calendar/index.php", "/pm-calendar"],
  ["/modules/assets_mgmt/index.php", "/assets"],
  ["/modules/checkout/index.php", "/checkout"],
  ["/modules/assets_mgmt/requests.php", "/asset-requests"],
  ["/modules/qr_scanner/index.php", "/qr-scanner"],
  ["/modules/asset_audit/index.php", "/asset-audit"],
  ["/modules/licenses/index.php", "/licenses"],
  ["/modules/subscriptions/index.php", "/subscriptions"],
  ["/modules/budget/index.php", "/budget"],
  ["/modules/licenses/by_asset.php", "/licenses/by-asset"],
  ["/modules/vendors/index.php", "/vendors"],
  ["/modules/vendors/create.php", "/vendors/new"],
  ["/modules/vault/index.php", "/vault"],
  ["/modules/settings/audit.php", "/audit-log"],
  ["/modules/offboarding/index.php", "/offboarding"],
  ["/modules/kb/index.php", "/knowledge-base"],
  ["/modules/reports/index.php", "/reports"],
  ["/modules/settings/users.php", "/users"],
  ["/modules/settings/index.php", "/settings"],
  ["/modules/settings/profile.php", "/profile"]
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return legacyRedirects.flatMap(([source, destination]) => [
      { source, destination, permanent: false },
      { source: `/itam-desk${source}`, destination, permanent: false }
    ]);
  }
};

export default nextConfig;
