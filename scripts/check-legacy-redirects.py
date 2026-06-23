import json
import os
import time

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:3000")
LOGIN = os.environ.get("ITAM_USER", "admin")
PASSWORD = os.environ.get("ITAM_PASSWORD", "Admin@1234")

LEGACY_PATHS = {
    "/itam-desk/dashboard.php": "/dashboard",
    "/itam-desk/modules/tickets/index.php": "/tickets",
    "/itam-desk/modules/tickets/create.php": "/tickets/new",
    "/itam-desk/modules/service_request/index.php": "/service-requests",
    "/itam-desk/modules/service_requests/index.php": "/service-requests",
    "/itam-desk/modules/access_request/index.php": "/access-requests",
    "/itam-desk/modules/access_requests/index.php": "/access-requests",
    "/itam-desk/modules/pm_calendar/index.php": "/pm-calendar",
    "/itam-desk/modules/assets_mgmt/index.php": "/assets",
    "/itam-desk/modules/checkout/index.php": "/checkout",
    "/itam-desk/modules/assets_mgmt/checkout.php": "/checkout",
    "/itam-desk/modules/assets_mgmt/requests.php": "/asset-requests",
    "/itam-desk/modules/qr_scanner/index.php": "/qr-scanner",
    "/itam-desk/modules/assets_mgmt/qr_scan.php": "/qr-scanner",
    "/itam-desk/modules/asset_audit/index.php": "/asset-audit",
    "/itam-desk/modules/assets_mgmt/audit.php": "/asset-audit",
    "/itam-desk/modules/licenses/index.php": "/licenses",
    "/itam-desk/modules/subscriptions/index.php": "/subscriptions",
    "/itam-desk/modules/licenses/subscriptions.php": "/subscriptions",
    "/itam-desk/modules/budget/index.php": "/budget",
    "/itam-desk/modules/licenses/budget.php": "/budget",
    "/itam-desk/modules/licenses/by_asset.php": "/licenses/by-asset",
    "/itam-desk/modules/vendors/index.php": "/vendors",
    "/itam-desk/modules/vendors/create.php": "/vendors/new",
    "/itam-desk/modules/vault/index.php": "/vault",
    "/itam-desk/modules/security/vault.php": "/vault",
    "/itam-desk/modules/settings/audit.php": "/audit-log",
    "/itam-desk/modules/audit_log/index.php": "/audit-log",
    "/itam-desk/modules/offboarding/index.php": "/offboarding",
    "/itam-desk/modules/hr/offboarding.php": "/offboarding",
    "/itam-desk/modules/kb/index.php": "/knowledge-base",
    "/itam-desk/modules/knowledge/index.php": "/knowledge-base",
    "/itam-desk/modules/reports/index.php": "/reports",
    "/itam-desk/modules/settings/users.php": "/users",
    "/itam-desk/modules/users/index.php": "/users",
    "/itam-desk/modules/settings/index.php": "/settings",
    "/itam-desk/modules/settings/profile.php": "/profile",
    "/itam-desk/modules/calendar/index.php": "/calendar",
    "/modules/tickets/index.php": "/tickets",
    "/modules/assets_mgmt/checkout.php": "/checkout",
    "/modules/licenses/subscriptions.php": "/subscriptions",
    "/modules/users/index.php": "/users",
}

API_PATHS = {
    "/api/notifications.php?action=unread_count": "unread_count",
    "/itam-desk/api/notifications.php?action=unread_count": "unread_count",
}


def goto_ready(page, path: str):
    last_error: Exception | None = None
    for _ in range(6):
        try:
            return page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=10000)
        except PlaywrightTimeoutError as error:
            last_error = error
            time.sleep(1)
    if last_error:
        raise last_error
    return None


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        goto_ready(page, "/login")
        page.locator("input[name='login']").fill(LOGIN)
        page.locator("input[name='password']").fill(PASSWORD)
        page.locator("form.login-form button[type='submit']").click()
        expect(page).to_have_url(f"{BASE_URL}/dashboard", timeout=15000)

        results = []
        for legacy_path, expected_path in LEGACY_PATHS.items():
            response = goto_ready(page, legacy_path)
            final_path = page.url.replace(BASE_URL, "")
            ok = response is not None and response.status < 400 and final_path == expected_path
            results.append({
                "legacy": legacy_path,
                "expected": expected_path,
                "final": final_path,
                "status": response.status if response else None,
                "ok": ok,
            })

        for api_path, expected_key in API_PATHS.items():
            response = page.request.get(f"{BASE_URL}{api_path}")
            data = response.json() if response.ok else {}
            results.append({
                "legacy": api_path,
                "expected": expected_key,
                "final": api_path,
                "status": response.status,
                "ok": response.ok and expected_key in data,
            })

        browser.close()

    print(json.dumps(results, ensure_ascii=False))
    failures = [item for item in results if not item["ok"]]
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
