import os
import re
import time
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:3000")
OUT_DIR = Path("output/playwright")


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
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 980})
        page.set_default_timeout(10000)
        page.set_default_navigation_timeout(10000)

        goto_ready(page, "/login")
        expect(page.get_by_role("heading", name="เข้าสู่ระบบ")).to_be_visible()
        page.locator("form.login-form").wait_for()
        page.locator("input[name='login']").fill("admin")
        page.locator("input[name='password']").fill("Admin@1234")
        page.get_by_role("button", name="เข้าสู่ระบบ").click()
        expect(page).to_have_url(re.compile(r".*/dashboard"))
        expect(page.get_by_role("heading", name="📊 Dashboard")).to_be_visible()
        expect(page.get_by_text("Ticket วันนี้")).to_be_visible()
        page.screenshot(path=str(OUT_DIR / "dashboard-desktop.png"), full_page=True)

        goto_ready(page, "/tickets")
        expect(page.get_by_role("heading", name="🎫 Service Ticket")).to_be_visible()
        expect(page.get_by_text("TKT-2569-00001")).to_be_visible()
        page.locator("#create input[name='title']").fill("ทดสอบสร้าง Ticket จาก Playwright")
        page.locator("#create textarea[name='description']").fill("ตรวจสอบว่า server action บันทึกลง store ได้จริง")
        page.locator("#create select[name='category']").select_option("Software")
        page.locator("#create select[name='priority']").select_option("ปกติ")
        page.locator("#create input[name='owner']").fill("QA Bot")
        page.locator("#create select[name='department']").select_option("IT Department")
        page.locator("#create form").get_by_role("button", name="บันทึก").click()
        page.wait_for_url("**/tickets?created=1")
        expect(page.get_by_text("บันทึกข้อมูลเรียบร้อยแล้ว")).to_be_visible()
        expect(page.get_by_text("ทดสอบสร้าง Ticket จาก Playwright").first).to_be_visible()

        response = page.request.get(f"{BASE_URL}/api/reports/tickets")
        assert response.ok, f"CSV report failed with {response.status}"
        assert "ทดสอบสร้าง Ticket จาก Playwright" in response.text()

        page.set_viewport_size({"width": 390, "height": 900})
        goto_ready(page, "/dashboard")
        overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
        assert not overflow, "Mobile dashboard has horizontal overflow"
        page.screenshot(path=str(OUT_DIR / "dashboard-mobile.png"), full_page=True)

        browser.close()


if __name__ == "__main__":
    main()
