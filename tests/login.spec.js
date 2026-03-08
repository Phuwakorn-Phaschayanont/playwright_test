// tests/login.spec.js
const { test, expect } = require("@playwright/test");

const BASE_URL = "https://www.saucedemo.com/";

const USERS = {
  standard:    { username: "standard_user",          password: "secret_sauce" },
  locked:      { username: "locked_out_user",         password: "secret_sauce" },
  problem:     { username: "problem_user",            password: "secret_sauce" },
  performance: { username: "performance_glitch_user", password: "secret_sauce" },
};

test.describe("🔐 Login Tests - SauceDemo", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  });

  // ─────────────────────────────────────────
  // ✅ Login สำเร็จ
  // ─────────────────────────────────────────

  test("TC01 - valid login with standard_user", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.standard.username);
    await page.locator("#password").fill(USERS.standard.password);
    await page.locator("#login-button").click();

    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator(".title")).toHaveText("Products");
  });

  test("TC02 - valid login with problem_user", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.problem.username);
    await page.locator("#password").fill(USERS.problem.password);
    await page.locator("#login-button").click();

    await expect(page).toHaveURL(/inventory/);
  });

  test("TC03 - valid login with performance_glitch_user", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.performance.username);
    await page.locator("#password").fill(USERS.performance.password);
    await page.locator("#login-button").click();

    await expect(page).toHaveURL(/inventory/, { timeout: 15000 }); // รอนานขึ้นเพราะ user นี้ช้า
  });

  // ─────────────────────────────────────────
  // ❌ Login ไม่สำเร็จ
  // ─────────────────────────────────────────

  test("TC04 - invalid username", async ({ page }) => {
    await page.locator("#user-name").fill("wrong_user");
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Username and password do not match"
    );
  });

  test("TC05 - invalid password", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.standard.username);
    await page.locator("#password").fill("wrong_password");
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Username and password do not match"
    );
  });

  test("TC06 - invalid username and password", async ({ page }) => {
    await page.locator("#user-name").fill("wrong_user");
    await page.locator("#password").fill("wrong_password");
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Username and password do not match"
    );
  });

  // ─────────────────────────────────────────
  // ⚠️ กรอกข้อมูลไม่ครบ
  // ─────────────────────────────────────────

  test("TC07 - empty username and password", async ({ page }) => {
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Username is required"
    );
  });

  test("TC08 - empty username only", async ({ page }) => {
    await page.locator("#password").fill("secret_sauce");
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Username is required"
    );
  });

  test("TC09 - empty password only", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.standard.username);
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Password is required"
    );
  });

  // ─────────────────────────────────────────
  // 🔒 Locked Out User
  // ─────────────────────────────────────────

  test("TC10 - locked out user cannot login", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.locked.username);
    await page.locator("#password").fill(USERS.locked.password);
    await page.locator("#login-button").click();

    await expect(page.locator("[data-test='error']")).toContainText(
      "Sorry, this user has been locked out"
    );
    await expect(page).toHaveURL(BASE_URL); // ยังอยู่หน้า login
  });

  // ─────────────────────────────────────────
  // 🚪 Logout
  // ─────────────────────────────────────────

  test("TC11 - logout after successful login", async ({ page }) => {
    await page.locator("#user-name").fill(USERS.standard.username);
    await page.locator("#password").fill(USERS.standard.password);
    await page.locator("#login-button").click();

    await expect(page).toHaveURL(/inventory/);

    await page.locator("#react-burger-menu-btn").click();
    await page.locator("#logout_sidebar_link").click();

    await expect(page).toHaveURL(BASE_URL);
    await expect(page.locator("#login-button")).toBeVisible();
  });

  test("TC12 - cannot access inventory without login", async ({ page }) => {
    await page.goto("https://www.saucedemo.com/inventory.html");

    // ต้องถูก redirect กลับมาหน้า login
    await expect(page).toHaveURL(BASE_URL);
  });

});