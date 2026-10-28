const { test, expect } = require('@playwright/test');

test.describe('SportBorrow admin functions', () => {
  test.skip(!process.env.SB_ADMIN_EMAIL || !process.env.SB_ADMIN_PASSWORD, 'Admin credentials required');
  test.use({ storageState: '.auth/admin.json' });

  async function open(page, route, text) {
    await page.goto(route);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText('กำลังโหลดข้อมูล…')).toBeHidden({ timeout: 15000 });
    if (text) await expect(page.getByRole('heading', { name: text, exact: false }).first()).toBeVisible();
  }

  test('TC-037 admin dashboard displays system metrics', async ({ page }) => {
    await open(page, '/admin', 'สถิติภาพรวม');
    await expect(page.getByText('สมาชิกทั้งหมด')).toBeVisible();
  });

  for (const [id, route, label] of [
    ['TC-038', '/admin/users', 'จัดการผู้ใช้งาน'],
    ['TC-039', '/admin/equipment', 'จัดการอุปกรณ์กีฬา'],
    ['TC-040', '/admin/borrows', 'จัดการการยืม'],
    ['TC-041', '/admin/returns', 'จัดการการคืน'],
    ['TC-042', '/admin/fines', 'จัดการค่าปรับ'],
    ['TC-043', '/admin/reports', 'รายงาน'],
    ['TC-044', '/admin/notifications', 'จัดการการแจ้งเตือน'],
    ['TC-045', '/admin/settings', 'ตั้งค่าระบบ'],
    ['TC-046', '/admin/system-logs', 'ประวัติการใช้งานระบบ'],
  ]) {
    test(`${id} admin ${route.split('/').at(-1)} page loads`, async ({ page }) => {
      await open(page, route, label);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
    });
  }

  test('TC-047 admin user search finds member', async ({ page }) => {
    await open(page, '/admin/users', 'จัดการผู้ใช้งาน');
    await page.getByPlaceholder('ค้นหาชื่อ อีเมล หรือรหัสผู้ใช้งาน').fill('phuwakorn.p@ku.th');
    await expect(page.getByRole('table').getByText('phuwakorn.p@ku.th')).toBeVisible();
    await expect(page.getByRole('table').getByText('armarmarm4547@gmail.com')).toHaveCount(0);
  });

  test('TC-048 admin equipment search finds code', async ({ page }) => {
    await open(page, '/admin/equipment', 'จัดการอุปกรณ์กีฬา');
    await page.getByPlaceholder('ค้นหาชื่อหรือ Equipment Code').fill('EQ-FT-0002');
    await expect(page.getByRole('table').getByText('EQ-FT-0002')).toBeVisible();
    await expect(page.getByRole('table').getByText('EQ-FB-0001')).toHaveCount(0);
  });

  test('TC-049 admin equipment category filter works', async ({ page }) => {
    await open(page, '/admin/equipment', 'จัดการอุปกรณ์กีฬา');
    await page.getByRole('combobox', { name: 'หมวดหมู่อุปกรณ์' }).selectOption({ label: 'ฟิตเนส' });
    await expect(page.getByRole('table').getByText('ดัมเบล')).toBeVisible();
    await expect(page.getByRole('table').getByText('ลูกฟุตบอล')).toHaveCount(0);
  });

  test('TC-050 admin report tabs change report type', async ({ page }) => {
    await open(page, '/admin/reports', 'รายงานการยืม');
    await page.getByRole('button', { name: 'รายงานค่าปรับ' }).click();
    await page.getByRole('button', { name: 'แสดงรายงาน' }).click();
    await expect(page.locator('body')).toContainText('รายงานค่าปรับ');
  });

  test('TC-051 admin settings sections switch', async ({ page }) => {
    await open(page, '/admin/settings', 'ตั้งค่าระบบ');
    await page.getByRole('button', { name: 'อัตราค่าปรับ' }).click();
    await expect(page.locator('body')).toContainText('อัตราค่าปรับ');
    await page.getByRole('button', { name: 'ระยะเวลายืม' }).click();
    await expect(page.locator('input[name="maxBorrowDays"]')).toBeVisible();
  });

  test('TC-052 admin system log search filters entries', async ({ page }) => {
    await open(page, '/admin/system-logs', 'ประวัติการใช้งานระบบ');
    await page.getByPlaceholder('ค้นหาการดำเนินการ รายละเอียด หรือผู้ใช้งาน').fill('เข้าสู่ระบบ');
    await expect(page.getByRole('table').getByText('เข้าสู่ระบบ').first()).toBeVisible();
  });

  test('TC-054 admin creates and deletes test equipment', async ({ page }) => {
    const code = `EQ-QA-${String(Date.now()).slice(-6)}`;
    await open(page, '/admin/equipment', 'จัดการอุปกรณ์กีฬา');
    try {
      await page.getByRole('button', { name: 'เพิ่มอุปกรณ์', exact: true }).first().click();
      await page.locator('input[name="code"]').fill(code);
      await page.locator('input[name="name"]').fill('QA Playwright test item');
      await page.locator('select[name="categoryId"]').selectOption({ label: 'ฟิตเนส' });
      await page.locator('input[name="location"]').fill('QA test location');
      await page.locator('input[name="total"]').fill('1');
      await page.locator('input[name="minStock"]').fill('0');
      await page.getByRole('button', { name: 'เพิ่มอุปกรณ์', exact: true }).last().click();
      await expect(page.getByRole('row').filter({ hasText: code })).toBeVisible();
    } finally {
      await page.goto('/admin/equipment');
      await page.getByPlaceholder('ค้นหาชื่อหรือ Equipment Code').fill(code);
      const row = page.getByRole('row').filter({ hasText: code });
      if (await row.count()) {
        await row.getByRole('button', { name: 'ลบ' }).click();
        await page.getByRole('button', { name: 'ลบอุปกรณ์' }).click();
        await expect(row).toHaveCount(0);
      }
    }
  });

  test('TC-055 equipment borrowed count matches active loans', async ({ page }) => {
    await open(page, '/admin/returns', 'จัดการการคืน');
    const activeRows = page.getByRole('row').filter({ hasText: 'กำลังยืม' });
    const first = activeRows.first();
    await expect(first).toBeVisible();
    const itemCell = await first.getByRole('cell').first().innerText();
    const name = itemCell.split('\n').map(s => s.trim()).filter(Boolean).at(-1);
    const active = await activeRows.filter({ hasText: name }).count();
    await open(page, '/admin/equipment', 'จัดการอุปกรณ์กีฬา');
    await page.getByPlaceholder('ค้นหาชื่อหรือ Equipment Code').fill(name);
    const row = page.getByRole('row').filter({ hasText: name }).first();
    await expect(row).toBeVisible();
    const borrowed = Number((await row.getByRole('cell').nth(3).innerText()).trim());
    expect(borrowed).toBe(active);
  });
});
