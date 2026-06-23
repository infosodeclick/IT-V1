import type { NextConfig } from "next";

const legacyRedirects = [
  ["/login.php", "/login"],
  ["/dashboard.php", "/dashboard"],
  ["/modules/calendar/index.php", "/calendar"],
  ["/modules/tickets/index.php", "/tickets"],
  ["/modules/tickets/create.php", "/tickets/new"],
  ["/modules/service_request/index.php", "/service-requests"],
  ["/modules/service_requests/index.php", "/service-requests"],
  ["/modules/access_request/index.php", "/access-requests"],
  ["/modules/access_requests/index.php", "/access-requests"],
  ["/modules/pm_calendar/index.php", "/pm-calendar"],
  ["/modules/assets_mgmt/index.php", "/assets"],
  ["/modules/checkout/index.php", "/checkout"],
  ["/modules/assets_mgmt/checkout.php", "/checkout"],
  ["/modules/assets_mgmt/requests.php", "/asset-requests"],
  ["/modules/qr_scanner/index.php", "/qr-scanner"],
  ["/modules/assets_mgmt/qr_scan.php", "/qr-scanner"],
  ["/modules/asset_audit/index.php", "/asset-audit"],
  ["/modules/assets_mgmt/audit.php", "/asset-audit"],
  ["/modules/licenses/index.php", "/licenses"],
  ["/modules/subscriptions/index.php", "/subscriptions"],
  ["/modules/licenses/subscriptions.php", "/subscriptions"],
  ["/modules/budget/index.php", "/budget"],
  ["/modules/licenses/budget.php", "/budget"],
  ["/modules/licenses/by_asset.php", "/licenses/by-asset"],
  ["/modules/vendors/index.php", "/vendors"],
  ["/modules/vendors/create.php", "/vendors/new"],
  ["/modules/vault/index.php", "/vault"],
  ["/modules/security/vault.php", "/vault"],
  ["/modules/settings/audit.php", "/audit-log"],
  ["/modules/audit_log/index.php", "/audit-log"],
  ["/modules/offboarding/index.php", "/offboarding"],
  ["/modules/hr/offboarding.php", "/offboarding"],
  ["/modules/kb/index.php", "/knowledge-base"],
  ["/modules/knowledge/index.php", "/knowledge-base"],
  ["/modules/reports/index.php", "/reports"],
  ["/modules/settings/users.php", "/users"],
  ["/modules/users/index.php", "/users"],
  ["/modules/settings/index.php", "/settings"],
  ["/modules/settings/profile.php", "/profile"]
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      ...legacyRedirects.flatMap(([source, destination]) => [
        { source, destination, permanent: false },
        { source: `/itam-desk${source}`, destination, permanent: false }
      ]),
      { source: "/itam-desk/api/notifications.php", destination: "/api/notifications.php", permanent: false }
    ];
  }
};

export default nextConfig;
