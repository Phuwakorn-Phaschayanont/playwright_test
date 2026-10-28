const { test, expect } = require('@playwright/test');

test('TC-056 registration email verification', async () => {
  test.skip(true, 'Requires a one-time email code and an authentication request allowed by the site');
});

test('TC-057 password reset link completion', async ({ browser }) => {
  const link = process.env.SB_RESET_LINK;
  const email = process.env.SB_RESET_EMAIL;
  const newPassword = process.env.SB_RESET_NEW_PASSWORD;
  test.skip(!link || !email || !newPassword, 'Requires a fresh emailed reset link, test email, and new test password in environment variables');
  const url = new URL(link);
  expect(url.origin).toBe('https://sportborrow.inprojex.tech');
  expect(url.pathname).toBe('/reset-password');

  const guest = await browser.newContext();
  const page = await guest.newPage();
  await page.goto(link);
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.locator('input[name="password"]').fill(newPassword);
  await page.locator('input[name="confirmPassword"]').fill(newPassword);
  await page.getByRole('button', { name: 'ตั้งรหัสผ่านใหม่' }).click();
  await expect(page.getByText('ตั้งรหัสผ่านใหม่สำเร็จ')).toBeVisible();
  await guest.close();

  const fresh = await browser.newContext();
  const login = await fresh.newPage();
  await login.goto('https://sportborrow.inprojex.tech/login');
  await login.locator('input[name="email"]').fill(email);
  await login.locator('input[name="password"]').fill(newPassword);
  await login.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(login).toHaveURL(/\/member$/);
  await fresh.close();
});

test('TC-058 authenticator two-factor setup', async () => {
  test.skip(true, 'Need a test authenticator app or shared test secret');
});

test('TC-059 fine payment slip verification', async () => {
  test.skip(true, 'Requires an outstanding fine on a test account and a valid test payment slip');
});

test('TC-060 database backup and restore', async () => {
  test.skip(true, 'Restore affects shared production data, outside test-data-only authorization');
});

test('TC-061 broadcast announcement', async () => {
  test.skip(true, 'Broadcast reaches non-test users, outside test-data-only authorization');
});
