import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/login.php", destination: "/login", permanent: false },
      { source: "/dashboard.php", destination: "/dashboard", permanent: false },
      { source: "/modules/calendar/index.php", destination: "/calendar", permanent: false },
      { source: "/modules/tickets/index.php", destination: "/tickets", permanent: false },
      { source: "/modules/tickets/create.php", destination: "/tickets/new", permanent: false },
      { source: "/modules/service_request/index.php", destination: "/service-requests", permanent: false },
      { source: "/modules/access_request/index.php", destination: "/access-requests", permanent: false },
      { source: "/modules/pm_calendar/index.php", destination: "/pm-calendar", permanent: false },
      { source: "/modules/assets_mgmt/index.php", destination: "/assets", permanent: false },
      { source: "/modules/checkout/index.php", destination: "/checkout", permanent: false },
      { source: "/modules/assets_mgmt/requests.php", destination: "/asset-requests", permanent: false },
      { source: "/modules/qr_scanner/index.php", destination: "/qr-scanner", permanent: false },
      { source: "/modules/asset_audit/index.php", destination: "/asset-audit", permanent: false },
      { source: "/modules/licenses/index.php", destination: "/licenses", permanent: false },
      { source: "/modules/subscriptions/index.php", destination: "/subscriptions", permanent: false },
      { source: "/modules/budget/index.php", destination: "/budget", permanent: false },
      { source: "/modules/licenses/by_asset.php", destination: "/licenses/by-asset", permanent: false },
      { source: "/modules/vendors/index.php", destination: "/vendors", permanent: false },
      { source: "/modules/vendors/create.php", destination: "/vendors/new", permanent: false },
      { source: "/modules/vault/index.php", destination: "/vault", permanent: false },
      { source: "/modules/settings/audit.php", destination: "/audit-log", permanent: false },
      { source: "/modules/offboarding/index.php", destination: "/offboarding", permanent: false },
      { source: "/modules/kb/index.php", destination: "/knowledge-base", permanent: false },
      { source: "/modules/reports/index.php", destination: "/reports", permanent: false },
      { source: "/modules/settings/users.php", destination: "/users", permanent: false },
      { source: "/modules/settings/index.php", destination: "/settings", permanent: false },
      { source: "/modules/settings/profile.php", destination: "/profile", permanent: false }
    ];
  }
};

export default nextConfig;
