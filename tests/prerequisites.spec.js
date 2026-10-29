const { test, expect } = require('@playwright/test');
const fs = require('fs');

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

test('TC-059 payment slip verification', async ({ browser }) => {
  test.setTimeout(60000);
  const qaFineId = process.env.SB_QA_FINE_ID;
  const reusedSlip = process.env.SB_REUSED_SLIP_PATH;
  const validFineId = process.env.SB_VALID_FINE_ID;
  const validMemberId = process.env.SB_VALID_MEMBER_ID;
  const validAmount = process.env.SB_VALID_FINE_AMOUNT;
  const validSlip = process.env.SB_VALID_SLIP_PATH;
  const duplicateReady = !!(qaFineId && reusedSlip);
  const validReady = !!(validFineId && validMemberId && validAmount && validSlip);
  test.skip(!duplicateReady && !validReady, 'Requires a QA fine and reused slip, or a valid slip and matching fine/member/amount');
  const admin = await browser.newContext({ baseURL: 'https://sportborrow.inprojex.tech', storageState: '.auth/admin.json' });
  try {
    const page = await admin.newPage();
    if (duplicateReady) {
      expect(fs.existsSync(reusedSlip)).toBe(true);
      await page.goto('/admin/fines');
      const row = page.getByRole('row').filter({ hasText: qaFineId });
      await expect(row).toContainText('QA');
      await expect(row).toContainText('ค้างชำระ');
      await row.getByRole('button', { name: 'จัดการค่าปรับ' }).click();
      await page.getByRole('button', { name: 'อัปโหลดและตรวจสลิป' }).click();
      await page.locator('input[type=file]').setInputFiles(reusedSlip);
      await page.getByPlaceholder(/โอนผ่าน Mobile Banking/).fill('QA Playwright duplicate slip verification');
      await page.getByRole('button', { name: 'ชำระเงินและตรวจสอบสลิป' }).click();
      await expect(page.getByText('สลิปนี้เคยถูกใช้ชำระเงินแล้ว กรุณาอัปโหลดสลิปใหม่')).toBeVisible();
      await expect(row).toContainText('สลิปไม่ผ่าน');
    }
    if (validReady) {
      expect(fs.existsSync(validSlip)).toBe(true);
      await page.goto('/admin/fines');
      const row = page.getByRole('row').filter({ hasText: validFineId });
      await expect(row).toContainText(validMemberId);
      await expect(row).toContainText(`฿${Number(validAmount).toFixed(2)}`);
      await expect(row).toContainText('ค้างชำระ');
      await row.getByRole('button', { name: 'จัดการค่าปรับ' }).click();
      await page.getByRole('button', { name: 'อัปโหลดและตรวจสลิป' }).click();
      await page.locator('input[type=file]').setInputFiles(validSlip);
      await page.getByPlaceholder(/โอนผ่าน Mobile Banking/).fill('QA Playwright fresh slip verification');
      await page.getByRole('button', { name: 'ชำระเงินและตรวจสอบสลิป' }).click();
      await expect(page.getByText('ชำระค่าปรับและปลดล็อกสมาชิกแล้ว')).toBeVisible();
      await page.getByRole('button', { name: 'ดูประวัติ' }).click();
      await expect(page.getByRole('row').filter({ hasText: validFineId }).last()).toContainText('ชำระแล้ว');
    }
  } finally { await admin.close(); }
});

test('TC-060 database backup and restore', async () => {
  test.skip(true, 'Restore affects shared production data, outside test-data-only authorization');
});

test('TC-061 broadcast announcement reaches QA member', async ({ browser }) => {
  test.setTimeout(60000);
  const qaEmail = process.env.SB_BROADCAST_QA_EMAIL;
  const qaPassword = process.env.SB_BROADCAST_QA_PASSWORD;
  test.skip(process.env.SB_RUN_BROADCAST_TEST !== '1' || !qaEmail || !qaPassword, 'Requires explicit broadcast opt-in and a QA recipient account');
  expect(qaEmail).toContain('+sbqa');
  const admin = await browser.newContext({ baseURL: 'https://sportborrow.inprojex.tech', storageState: '.auth/admin.json' });
  const member = await browser.newContext({ baseURL: 'https://sportborrow.inprojex.tech' });
  const adminPage = await admin.newPage();
  const title = `QA TEST SportBorrow ${Date.now()}`;
  let created = false;
  try {
    await adminPage.goto('/admin/notifications');
    await adminPage.getByPlaceholder('เช่น แจ้งปิดศูนย์กีฬา').fill(title);
    await adminPage.getByPlaceholder('รายละเอียดประกาศสำหรับสมาชิก').fill('ข้อความทดสอบ Playwright กรุณาเพิกเฉย ไม่มีการเปลี่ยนแปลงบริการ');
    await adminPage.locator('select').first().selectOption({ label: 'สมาชิกทั้งหมด' });
    await adminPage.getByRole('button', { name: 'ส่งประกาศ' }).click();
    await expect(adminPage.getByText('ยืนยันการส่งประกาศ?')).toBeVisible();
    await adminPage.getByRole('button', { name: 'ส่งประกาศ', exact: true }).last().click();
    created = true;
    const heading = adminPage.getByText(title, { exact: true });
    await expect(heading).toBeVisible();
    await expect(heading.locator('..').locator('..').locator('..')).toContainText(/ผู้รับ [1-9]\d* คน/);

    const memberPage = await member.newPage();
    await memberPage.goto('/login');
    await memberPage.locator('input[name=email]').fill(qaEmail);
    await memberPage.locator('input[name=password]').fill(qaPassword);
    await memberPage.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(memberPage).toHaveURL(/\/member$/);
    if (!await memberPage.getByRole('button', { name: 'การแจ้งเตือน' }).isVisible()) await memberPage.getByRole('button', { name: 'เปิดเมนูนำทาง' }).click();
    await memberPage.getByRole('button', { name: 'การแจ้งเตือน' }).click();
    await expect(memberPage.getByText(title, { exact: true })).toBeVisible();
  } finally {
    if (created) {
      await adminPage.goto('/admin/notifications');
      const heading = adminPage.getByText(title, { exact: true });
      if (await heading.count()) {
        await heading.locator('..').locator('..').getByRole('button', { name: 'ลบประกาศ' }).click();
        await adminPage.getByRole('button', { name: 'ลบประกาศ', exact: true }).click();
        await expect(heading).toHaveCount(0);
      }
    }
    await member.close();
    await admin.close();
  }
});
