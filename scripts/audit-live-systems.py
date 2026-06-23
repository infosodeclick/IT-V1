import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


OLD_BASE = os.environ.get("OLD_BASE", "https://webappwebsite.com/itam-desk")
NEW_BASE = os.environ.get("NEW_BASE", "https://it-v1-production.up.railway.app")
ITAM_USER = os.environ.get("ITAM_USER", "admin")
ITAM_PASSWORD = os.environ.get("ITAM_PASSWORD", "Admin@1234")
OUT_DIR = Path("output/playwright")

OLD_PATHS = [
    "/dashboard.php",
    "/modules/calendar/index.php",
    "/modules/tickets/index.php",
    "/modules/tickets/create.php",
    "/modules/service_request/index.php",
    "/modules/access_request/index.php",
    "/modules/pm_calendar/index.php",
    "/modules/assets_mgmt/index.php",
    "/modules/checkout/index.php",
    "/modules/assets_mgmt/requests.php",
    "/modules/qr_scanner/index.php",
    "/modules/asset_audit/index.php",
    "/modules/licenses/index.php",
    "/modules/subscriptions/index.php",
    "/modules/budget/index.php",
    "/modules/licenses/by_asset.php",
    "/modules/vendors/index.php",
    "/modules/vendors/create.php",
    "/modules/vault/index.php",
    "/modules/settings/audit.php",
    "/modules/offboarding/index.php",
    "/modules/kb/index.php",
    "/modules/reports/index.php",
    "/modules/settings/users.php",
    "/modules/settings/index.php",
    "/modules/settings/profile.php",
]

NEW_PATHS = [
    "/dashboard",
    "/calendar",
    "/tickets",
    "/tickets/new",
    "/service-requests",
    "/access-requests",
    "/pm-calendar",
    "/assets",
    "/checkout",
    "/asset-requests",
    "/qr-scanner",
    "/asset-audit",
    "/licenses",
    "/subscriptions",
    "/budget",
    "/licenses/by-asset",
    "/vendors",
    "/vendors/new",
    "/vault",
    "/audit-log",
    "/offboarding",
    "/knowledge-base",
    "/reports",
    "/users",
    "/settings",
    "/profile",
]


def goto_ready(page, url: str, wait_until: str = "domcontentloaded"):
    last_error = None
    for _ in range(4):
        try:
            return page.goto(url, wait_until=wait_until, timeout=15000)
        except PlaywrightTimeoutError as error:
            last_error = error
            time.sleep(1)
    if last_error:
        raise last_error
    return None


def login_old(page):
    goto_ready(page, OLD_BASE)
    page.locator("input[name='username'], input[name='email'], input[name='login']").first.fill(ITAM_USER)
    page.locator("input[name='password']").first.fill(ITAM_PASSWORD)
    page.locator("button[type='submit'], input[type='submit']").first.click()
    page.wait_for_load_state("domcontentloaded", timeout=15000)
    return page.url


def login_new(page):
    goto_ready(page, urljoin(NEW_BASE, "/login"))
    page.locator("input[name='login']").fill(ITAM_USER)
    page.locator("input[name='password']").fill(ITAM_PASSWORD)
    page.locator("form.login-form button[type='submit']").click()
    page.wait_for_url(re.compile(r".*/dashboard"), timeout=15000)
    return page.url


def page_summary(page, base: str, path: str):
    url = urljoin(base.rstrip("/") + "/", path.lstrip("/"))
    errors = []
    response_status = None
    try:
        response = goto_ready(page, url)
        response_status = response.status if response else None
    except Exception as error:
        return {"path": path, "url": url, "ok": False, "error": f"navigation: {error}"}

    title = page.title()
    body_text = page.locator("body").inner_text(timeout=5000)
    lower = body_text.lower()
    if response_status and response_status >= 400:
        errors.append(f"http_{response_status}")
    if "fatal error" in lower or "warning:" in lower or "notice:" in lower:
        errors.append("php_or_runtime_warning")
    if "application error" in lower or "internal server error" in lower:
        errors.append("app_error_text")
    parsed_url = urlparse(page.url)
    if parsed_url.path.endswith("/login") or parsed_url.path.endswith("/login.php"):
        errors.append("redirected_to_login")

    forms = page.locator("form").count()
    inputs = page.locator("input, select, textarea").count()
    tables = page.locator("table").count()
    buttons = page.locator("button, input[type='submit'], a.btn, .button").count()
    headings = page.locator("h1,h2,h3").evaluate_all("(els) => els.slice(0, 8).map((el) => el.innerText.trim()).filter(Boolean)")
    links = page.locator("a").evaluate_all(
        """(els) => els.slice(0, 80).map((a) => ({
            text: a.innerText.trim(),
            href: a.href
        })).filter((x) => x.href)"""
    )

    return {
        "path": path,
        "url": page.url,
        "ok": len(errors) == 0,
        "status": response_status,
        "title": title,
        "errors": errors,
        "forms": forms,
        "inputs": inputs,
        "tables": tables,
        "buttons": buttons,
        "headings": headings,
        "sampleLinks": links[:20],
    }


def check_broken_links(page, base: str, summaries):
    base_host = urlparse(base).netloc
    candidates = []
    seen = set()
    for summary in summaries:
        for link in summary.get("sampleLinks", []):
            href = link["href"]
            if href in seen:
                continue
            seen.add(href)
            parsed = urlparse(href)
            if parsed.netloc != base_host:
                continue
            if href.endswith("#") or "logout" in href:
                continue
            candidates.append(href)

    checked = []
    for href in candidates[:60]:
        try:
            response = page.request.get(href, timeout=10000)
            checked.append({"url": href, "status": response.status, "ok": response.status < 400})
        except Exception as error:
            checked.append({"url": href, "status": None, "ok": False, "error": str(error)})
    return checked


def audit_system(name: str, base: str, paths, login_fn, browser):
    context = browser.new_context(viewport={"width": 1440, "height": 980})
    page = context.new_page()
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    login_url = login_fn(page)
    summaries = [page_summary(page, base, path) for path in paths]
    page.goto(urljoin(base.rstrip("/") + "/", paths[0].lstrip("/")), wait_until="domcontentloaded", timeout=15000)
    page.screenshot(path=str(OUT_DIR / f"{name}-dashboard.png"), full_page=True)

    page.set_viewport_size({"width": 390, "height": 900})
    page.goto(urljoin(base.rstrip("/") + "/", paths[0].lstrip("/")), wait_until="domcontentloaded", timeout=15000)
    mobile_overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
    page.screenshot(path=str(OUT_DIR / f"{name}-mobile.png"), full_page=True)

    links = check_broken_links(page, base, summaries)
    context.close()
    return {
        "name": name,
        "base": base,
        "loginUrlAfterSubmit": login_url,
        "summaries": summaries,
        "brokenLinks": [item for item in links if not item["ok"]],
        "consoleErrors": console_errors[:40],
        "mobileOverflow": mobile_overflow,
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        results = {
            "old": audit_system("old", OLD_BASE, OLD_PATHS, login_old, browser),
            "new": audit_system("new", NEW_BASE, NEW_PATHS, login_new, browser),
        }
        browser.close()

    output_path = OUT_DIR / "live-audit.json"
    output_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "old_ok_pages": sum(1 for item in results["old"]["summaries"] if item["ok"]),
        "new_ok_pages": sum(1 for item in results["new"]["summaries"] if item["ok"]),
        "old_broken_links": len(results["old"]["brokenLinks"]),
        "new_broken_links": len(results["new"]["brokenLinks"]),
        "old_mobile_overflow": results["old"]["mobileOverflow"],
        "new_mobile_overflow": results["new"]["mobileOverflow"],
        "output": str(output_path),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
