// fail_test.spec.js
// ไฟล์นี้สร้างเพื่อทดสอบว่า Screenshot และ Video ทำงานได้ไหมเมื่อ test fail

const { test, expect } = require("@playwright/test");

const BASE_URL = "https://www.saucedemo.com/";

test.describe("🧪 Fail Test - ทดสอบ Screenshot & Video", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  });

  // ❌ ตั้งใจให้ fail — expect URL ผิด
  test("TC_FAIL01 - intentional fail wrong URL", async ({ page }) => {
    await page.locator("#user-name").fill("standard_user");
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();

    // login สำเร็จจริง แต่ expect ผิดตั้งใจ → fail
    await expect(page).toHaveURL(/THIS_WILL_FAIL/);
  });

  // ❌ ตั้งใจให้ fail — expect ข้อความผิด
  test("TC_FAIL02 - intentional fail wrong text", async ({ page }) => {
    await expect(page.locator(".login_logo")).toHaveText("THIS TEXT DOES NOT EXIST");
  });

  // ✅ test ปกติที่ผ่าน (เอาไว้เปรียบเทียบ)
  test("TC_PASS01 - this test should pass", async ({ page }) => {
    await page.locator("#user-name").fill("standard_user");
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();

    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator(".title")).toHaveText("Products");
  });

});