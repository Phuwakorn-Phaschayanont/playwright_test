// tests/products.spec.js
const { test, expect } = require("@playwright/test");

const BASE_URL = "https://www.saucedemo.com/";

test.describe("🛍️ Products Tests - SauceDemo", () => {

  // Login ก่อนทุก test
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("#user-name").fill("standard_user");
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();
    await expect(page).toHaveURL(/inventory/);
  });

  // ─────────────────────────────────────────
  // 📋 แสดงสินค้า
  // ─────────────────────────────────────────

  test("TC01 - แสดงหน้า Products ได้ถูกต้อง", async ({ page }) => {
    await expect(page.locator(".title")).toHaveText("Products");
  });

  test("TC02 - แสดงสินค้าครบ 6 ชิ้น", async ({ page }) => {
    const items = page.locator(".inventory_item");
    await expect(items).toHaveCount(6);
  });

  test("TC03 - สินค้าแต่ละชิ้นมีชื่อ รูป และราคา", async ({ page }) => {
    const items = page.locator(".inventory_item");
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await expect(item.locator(".inventory_item_name")).not.toBeEmpty();
      await expect(item.locator(".inventory_item_price")).not.toBeEmpty();
      await expect(item.locator("img")).toBeVisible();
    }
  });

  // ─────────────────────────────────────────
  // 🔤 Sorting
  // ─────────────────────────────────────────

  test("TC04 - sort A to Z (default)", async ({ page }) => {
    const names = await page.locator(".inventory_item_name").allTextContents();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test("TC05 - sort Z to A", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("za");

    const names = await page.locator(".inventory_item_name").allTextContents();
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });

  test("TC06 - sort ราคาต่ำไปสูง", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("lohi");

    const priceTexts = await page.locator(".inventory_item_price").allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test("TC07 - sort ราคาสูงไปต่ำ", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("hilo");

    const priceTexts = await page.locator(".inventory_item_price").allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  // ─────────────────────────────────────────
  // 🛒 Add to Cart
  // ─────────────────────────────────────────

  test("TC08 - เพิ่มสินค้าชิ้นแรกเข้า Cart", async ({ page }) => {
    await page.locator(".inventory_item").first().locator("button").click();

    // badge บน cart icon ต้องแสดง 1
    await expect(page.locator(".shopping_cart_badge")).toHaveText("1");
  });

  test("TC09 - เพิ่มสินค้าหลายชิ้นเข้า Cart", async ({ page }) => {
    const buttons = page.locator(".inventory_item button");
    await buttons.nth(0).click();
    await buttons.nth(1).click();
    await buttons.nth(2).click();

    await expect(page.locator(".shopping_cart_badge")).toHaveText("3");
  });

  test("TC10 - ปุ่มเปลี่ยนเป็น Remove หลัง Add", async ({ page }) => {
    const firstItem = page.locator(".inventory_item").first();
    await firstItem.locator("button").click();

    await expect(firstItem.locator("button")).toHaveText("Remove");
  });

  test("TC11 - Remove สินค้าออกจาก Cart", async ({ page }) => {
    const firstItem = page.locator(".inventory_item").first();
    await firstItem.locator("button").click();
    await expect(page.locator(".shopping_cart_badge")).toHaveText("1");

    // กด Remove
    await firstItem.locator("button").click();
    await expect(page.locator(".shopping_cart_badge")).not.toBeVisible();
  });

  // ─────────────────────────────────────────
  // 🔍 Product Detail
  // ─────────────────────────────────────────

  test("TC12 - คลิกชื่อสินค้าเข้าหน้า Detail ได้", async ({ page }) => {
    const firstName = await page.locator(".inventory_item_name").first().textContent();
    await page.locator(".inventory_item_name").first().click();

    await expect(page).toHaveURL(/inventory-item/);
    await expect(page.locator(".inventory_details_name")).toHaveText(firstName);
  });

  test("TC13 - กดปุ่ม Back กลับหน้า Products ได้", async ({ page }) => {
    await page.locator(".inventory_item_name").first().click();
    await page.locator("[data-test='back-to-products']").click();

    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator(".title")).toHaveText("Products");
  });

});