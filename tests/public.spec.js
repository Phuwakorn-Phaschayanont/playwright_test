const { test, expect } = require('@playwright/test');

async function openRegistration(page) {
  await page.goto('/login');
  await page.getByRole('link', { name: 'สมัครสมาชิก' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="password"]')).toBeVisible();
}

async function openForgotPassword(page) {
  await page.goto('/login');
  await page.getByRole('link', { name: 'ลืมรหัสผ่าน?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.waitForLoadState('networkidle');
}

test.describe('SportBorrow public and authentication', () => {
  test('TC-001 root opens login for guest', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible();
  });

  test('TC-002 login form displays email and password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible();
  });

  test('TC-003 empty login shows required errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page.getByText('กรุณากรอกอีเมล')).toBeVisible();
    await expect(page.getByText('กรุณากรอกรหัสผ่าน')).toBeVisible();
  });

  test('TC-004 invalid login email shows format error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="password"]').fill('anything123');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeVisible();
  });

  test('TC-005 incorrect credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('qa-nonexistent@example.com');
    await page.locator('input[name="password"]').fill('incorrect-password-123');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-006 password visibility toggles', async ({ page }) => {
    await page.goto('/login');
    const field = page.locator('input[name="password"]');
    await page.getByRole('button', { name: 'แสดงรหัสผ่าน' }).click();
    await expect(field).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'ซ่อนรหัสผ่าน' }).click();
    await expect(field).toHaveAttribute('type', 'password');
  });

  test('TC-007 remember me checkbox toggles', async ({ page }) => {
    await page.goto('/login');
    const checkbox = page.getByRole('checkbox');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('TC-008 registration link opens registration form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'สมัครสมาชิก' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('TC-009 empty registration shows required validation', async ({ page }) => {
    await openRegistration(page);
    await page.getByRole('button', { name: 'ส่งรหัสยืนยันอีเมล' }).click();
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[name="lastName"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-010 registration rejects invalid email', async ({ page }) => {
    await openRegistration(page);
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.getByRole('button', { name: 'ส่งรหัสยืนยันอีเมล' }).click();
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-011 registration rejects password mismatch', async ({ page }) => {
    await openRegistration(page);
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill('qa@example.com');
    await page.locator('input[name="password"]').pressSequentially('StrongPassword123!');
    await page.locator('input[name="confirmPassword"]').fill('OtherPassword123!');
    await page.getByRole('button', { name: 'ส่งรหัสยืนยันอีเมล' }).click();
    await expect(page.locator('input[name="confirmPassword"]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-012 registration displays password strength', async ({ page }) => {
    await openRegistration(page);
    await page.locator('input[name="password"]').pressSequentially('StrongPassword123!');
    await expect(page.getByText(/ความปลอดภัย:/)).toBeVisible();
    await expect(page.getByText('ยังไม่ได้กรอก')).toHaveCount(0);
  });

  test('TC-013 registration requires accepted terms', async ({ page }) => {
    await openRegistration(page);
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill('qa@example.com');
    await page.locator('input[name="password"]').fill('StrongPassword123!');
    await page.locator('input[name="confirmPassword"]').fill('StrongPassword123!');
    await page.getByRole('button', { name: 'ส่งรหัสยืนยันอีเมล' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByText('กรุณายอมรับข้อกำหนดการใช้งาน')).toBeVisible();
  });

  test('TC-014 forgot password link opens request form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'ลืมรหัสผ่าน?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('TC-015 empty forgot password request shows error', async ({ page }) => {
    await openForgotPassword(page);
    await page.getByRole('button', { name: 'ส่งลิงก์ตั้งรหัสผ่านใหม่' }).click();
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-016 invalid forgot password email shows error', async ({ page }) => {
    await openForgotPassword(page);
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.getByRole('button', { name: 'ส่งลิงก์ตั้งรหัสผ่านใหม่' }).click();
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });

  for (const [id, route] of [['TC-017','/member/equipment'],['TC-018','/admin/users']]) {
    test(`${id} guest cannot access ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
