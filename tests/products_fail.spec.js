// tests/products_fail.spec.js
const { test, expect } = require("@playwright/test");

const BASE_URL = "https://www.saucedemo.com/";

test.describe("❌ Products Fail Test - ทดสอบ Screenshot & Video & Trace", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("#user-name").fill("standard_user");
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();
    await expect(page).toHaveURL(/inventory/);
  });

  // ❌ TC_FAIL01 — จำนวนสินค้าผิด
  test("TC_FAIL01 - จำนวนสินค้าไม่ใช่ 10 ชิ้น", async ({ page }) => {
    const items = page.locator(".inventory_item");
    await expect(items).toHaveCount(10); // จริงๆ มีแค่ 6
  });

  // ❌ TC_FAIL02 — ชื่อหน้าผิด
  test("TC_FAIL02 - title ไม่ใช่ Shopping Cart", async ({ page }) => {
    await expect(page.locator(".title")).toHaveText("Shopping Cart"); // จริงๆ คือ Products
  });

  // ❌ TC_FAIL03 — Sort แล้ว expect ผิด
  test("TC_FAIL03 - sort Z to A แต่ expect A to Z", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("za");

    const names = await page.locator(".inventory_item_name").allTextContents();
    const sortedAZ = [...names].sort(); // expect A→Z แต่จริงๆ เรียง Z→A
    expect(names).toEqual(sortedAZ);   // ← fail
  });

  // ❌ TC_FAIL04 — badge ไม่ใช่ 5
  test("TC_FAIL04 - เพิ่ม 1 ชิ้น แต่ expect badge = 5", async ({ page }) => {
    await page.locator(".inventory_item").first().locator("button").click();
    await expect(page.locator(".shopping_cart_badge")).toHaveText("5"); // จริงๆ คือ 1
  });

  // ❌ TC_FAIL05 — คลิก detail แต่ expect URL ผิด
  test("TC_FAIL05 - คลิกสินค้าแต่ expect URL ผิด", async ({ page }) => {
    await page.locator(".inventory_item_name").first().click();
    await expect(page).toHaveURL(/checkout/); // จริงๆ ไปหน้า inventory-item
  });

  // ✅ TC_PASS01 — ผ่านปกติ เอาไว้เปรียบเทียบ
  test("TC_PASS01 - แสดงสินค้าครบ 6 ชิ้น (pass)", async ({ page }) => {
    const items = page.locator(".inventory_item");
    await expect(items).toHaveCount(6);
  });

});