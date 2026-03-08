// tests/sorting.spec.js
const { test, expect } = require("@playwright/test");

const BASE_URL = "https://www.saucedemo.com/";

test.describe("🔀 Sorting & Filter Tests - SauceDemo", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("#user-name").fill("standard_user");
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();
    await expect(page).toHaveURL(/inventory/);
  });

  // ─────────────────────────────────────────
  // 🔤 Sort ตามชื่อ
  // ─────────────────────────────────────────

  test("TC01 - default sort คือ A to Z", async ({ page }) => {
    const selected = await page.locator(".product_sort_container").inputValue();
    expect(selected).toBe("az");

    const names = await page.locator(".inventory_item_name").allTextContents();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test("TC02 - sort A to Z", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("az");

    const names = await page.locator(".inventory_item_name").allTextContents();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test("TC03 - sort Z to A", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("za");

    const names = await page.locator(".inventory_item_name").allTextContents();
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });

  // ─────────────────────────────────────────
  // 💰 Sort ตามราคา
  // ─────────────────────────────────────────

  test("TC04 - sort ราคาต่ำไปสูง", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("lohi");

    const priceTexts = await page.locator(".inventory_item_price").allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test("TC05 - sort ราคาสูงไปต่ำ", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("hilo");

    const priceTexts = await page.locator(".inventory_item_price").allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  test("TC06 - ราคาต่ำสุดและสูงสุดถูกต้อง", async ({ page }) => {
    await page.locator(".product_sort_container").selectOption("lohi");

    const priceTexts = await page.locator(".inventory_item_price").allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));

    expect(prices[0]).toBe(Math.min(...prices));                  // ถูกสุดอยู่อันแรก
    expect(prices[prices.length - 1]).toBe(Math.max(...prices)); // แพงสุดอยู่อันสุดท้าย
  });

  // ─────────────────────────────────────────
  // 🔁 เปลี่ยน Sort หลายครั้ง
  // ─────────────────────────────────────────

  test("TC07 - เปลี่ยน sort หลายครั้งติดกัน", async ({ page }) => {
    // เปลี่ยนไป Z→A
    await page.locator(".product_sort_container").selectOption("za");
    let names = await page.locator(".inventory_item_name").allTextContents();
    expect(names).toEqual([...names].sort().reverse());

    // เปลี่ยนกลับ A→Z
    await page.locator(".product_sort_container").selectOption("az");
    names = await page.locator(".inventory_item_name").allTextContents();
    expect(names).toEqual([...names].sort());

    // เปลี่ยนไปราคาต่ำ→สูง
    await page.locator(".product_sort_container").selectOption("lohi");
    const priceTexts = await page.locator(".inventory_item_price").allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test("TC08 - จำนวนสินค้าไม่เปลี่ยนหลัง sort", async ({ page }) => {
    const beforeSort = await page.locator(".inventory_item").count();

    await page.locator(".product_sort_container").selectOption("za");
    const afterSort = await page.locator(".inventory_item").count();

    expect(beforeSort).toBe(afterSort); // ยังคงมี 6 ชิ้นเหมือนเดิม
  });

  // ─────────────────────────────────────────
  // 🔍 ตรวจสอบ Dropdown
  // ─────────────────────────────────────────

  test("TC09 - dropdown มีตัวเลือกครบ 4 อัน", async ({ page }) => {
    const options = await page.locator(".product_sort_container option").allTextContents();
    expect(options).toHaveLength(4);
    expect(options).toContain("Name (A to Z)");
    expect(options).toContain("Name (Z to A)");
    expect(options).toContain("Price (low to high)");
    expect(options).toContain("Price (high to low)");
  });

});