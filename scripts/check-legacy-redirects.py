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
    "/itam-desk/modules/assets_mgmt/index.php": "/assets",
    "/itam-desk/modules/settings/profile.php": "/profile",
    "/modules/tickets/index.php": "/tickets",
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

        browser.close()

    print(json.dumps(results, ensure_ascii=False))
    failures = [item for item in results if not item["ok"]]
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
