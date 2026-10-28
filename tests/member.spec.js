const { test, expect } = require('@playwright/test');

test.describe('SportBorrow member functions', () => {
  test.skip(!process.env.SB_MEMBER_EMAIL || !process.env.SB_MEMBER_PASSWORD, 'Member credentials required');
  test.use({ storageState: '.auth/member.json' });

  async function open(page, route, text) {
    await page.goto(route);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText('กำลังโหลดข้อมูล…')).toBeHidden({ timeout: 15000 });
    if (text) await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  test('TC-019 member dashboard loads', async ({ page }) => {
    await open(page, '/member', 'ค้นหาอุปกรณ์สำหรับกีฬาที่คุณรัก');
    await expect(page.getByRole('link', { name: 'สำรวจอุปกรณ์กีฬา' }).first()).toBeVisible();
  });

  test('TC-020 equipment catalog lists available items', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await expect(page.getByText('ดัมเบล').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'ถัดไป' })).toBeVisible();
  });

  test('TC-021 equipment search finds matching item', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await page.getByPlaceholder(/ค้นหาอุปกรณ์กีฬา/).fill('ดัมเบล');
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await expect(page.getByText('ดัมเบล').first()).toBeVisible();
    await expect(page.getByText('ลูกฟุตบอล').first()).toHaveCount(0);
  });

  test('TC-022 category filter narrows equipment list', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await page.getByRole('radio', { name: /ฟิตเนส/ }).check();
    await expect(page.getByText('ดัมเบล').first()).toBeVisible();
    await expect(page.getByText('ลูกฟุตบอล').first()).toHaveCount(0);
  });

  test('TC-023 clear equipment filters restores list', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await page.getByPlaceholder(/ค้นหาอุปกรณ์กีฬา/).fill('ดัมเบล');
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.getByRole('button', { name: 'ล้างตัวกรอง' }).click();
    await expect(page.getByPlaceholder(/ค้นหาอุปกรณ์กีฬา/)).toHaveValue('');
    await expect(page.getByText('เสื่อออกกำลังกาย').first()).toBeVisible();
  });

  test('TC-024 equipment list view toggles', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await page.getByRole('button', { name: 'แสดงแบบรายการ' }).click();
    await expect(page.getByText('ดัมเบล').first()).toBeVisible();
    await page.getByRole('button', { name: 'แสดงแบบตาราง' }).click();
    await expect(page.getByText('ดัมเบล').first()).toBeVisible();
  });

  test('TC-025 equipment pagination advances and returns', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await page.getByRole('button', { name: 'ถัดไป' }).click();
    await expect(page.getByText('หน้า 2 จาก 2')).toBeVisible();
    await page.getByRole('button', { name: 'ก่อนหน้า' }).click();
    await expect(page.getByText('หน้า 1 จาก 2')).toBeVisible();
  });

  test('TC-026 equipment detail shows item and stock', async ({ page }) => {
    await open(page, '/member/equipment/17', 'ดัมเบล');
    await expect(page.getByText(/พร้อมให้ยืม/).first()).toBeVisible();
  });

  test('TC-027 borrow page communicates member eligibility', async ({ page }) => {
    await open(page, '/member/equipment/17/borrow');
    await expect(page.locator('body')).toContainText(/ยืม|ระงับ/);
  });

  test('TC-028 history displays borrowing records', async ({ page }) => {
    await open(page, '/member/history');
    await expect(page.getByRole('heading', { name: 'รายการของฉัน' })).toBeVisible();
    await page.getByRole('button', { name: 'ดูประวัติทั้งหมด' }).click();
    await expect(page.getByText('ประวัติการยืม').first()).toBeVisible();
  });

  for (const [id, tab, label] of [
    ['TC-029', 'borrow', 'ประวัติการยืม'],
    ['TC-030', 'return', 'ประวัติการคืน'],
    ['TC-031', 'fine', 'ประวัติค่าปรับ'],
  ]) {
    test(`${id} history ${tab} tab opens`, async ({ page }) => {
      await open(page, `/member/history?tab=${tab}`, label);
      await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
    });
  }

  test('TC-032 return location map opens', async ({ page }) => {
    await open(page, '/member/map');
    await expect(page.locator('body')).toContainText(/จุดรับ|แผนที่/);
  });

  test('TC-033 member profile displays editable contact fields', async ({ page }) => {
    await open(page, '/account/profile', 'ข้อมูลส่วนตัว');
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test('TC-034 member security page opens', async ({ page }) => {
    await open(page, '/account/security', 'ความปลอดภัย');
    await expect(page.locator('body')).toContainText(/รหัสผ่าน|ยืนยันตัวตน/);
  });

  test('TC-035 notification menu opens', async ({ page }) => {
    await open(page, '/member/equipment', 'รายการอุปกรณ์กีฬา');
    await page.getByRole('button', { name: 'เปิดเมนูนำทาง' }).click();
    await page.getByRole('button', { name: 'การแจ้งเตือน' }).click();
    await expect(page.locator('body')).toContainText('การแจ้งเตือน');
  });

  test('TC-036 member cannot access admin users', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).not.toHaveURL(/\/admin\/users$/);
  });

  test('TC-053 borrow approval and return lifecycle', async ({ page, browser }) => {
    test.setTimeout(90000);
    test.skip(!process.env.SB_ADMIN_EMAIL || !process.env.SB_ADMIN_PASSWORD, 'Admin credentials required');
    const adminContext = await browser.newContext({ storageState: '.auth/admin.json' });
    const adminPage = await adminContext.newPage();
    let borrowId = '';
    let returned = false;
    try {
      await page.goto('/member/equipment/17/borrow');
      await expect(page.getByRole('button', { name: 'ส่งคำขอยืม' })).toBeVisible();
      await page.locator('textarea[name="purpose"]').fill('QA Playwright automated borrowing test');
      await page.locator('input[name="acceptRules"]').check();
      await page.getByRole('button', { name: 'ส่งคำขอยืม' }).click();
      await page.getByRole('button', { name: 'ส่งคำขอยืม', exact: true }).last().click();
      await expect(page).toHaveURL(/\/member\/history/);
      await expect(page.getByText('ส่งคำขอยืมเรียบร้อย')).toBeVisible();
      await expect(page.getByText(/BRW-\d{4}-\d+/).first()).toBeVisible();
      borrowId = (await page.locator('body').innerText()).match(/BRW-\d{4}-\d+/)?.[0] || '';
      expect(borrowId).toBeTruthy();

      await adminPage.goto('/admin/borrows');
      await expect(adminPage.getByText(borrowId).first()).toBeVisible();
      await adminPage.getByRole('button', { name: 'จัดการคำขอ' }).click();
      await expect(adminPage.getByText('QA Playwright automated borrowing test')).toBeVisible();
      await adminPage.getByRole('button', { name: 'อนุมัติคำขอ' }).click();
      await adminPage.getByRole('button', { name: 'อนุมัติคำขอ', exact: true }).last().click();

      await adminPage.goto('/admin/returns');
      await adminPage.getByRole('button', { name: 'บันทึกรับคืน' }).click();
      const option = await adminPage.locator('select[name="borrowId"] option').evaluateAll((xs, id) => xs.find(x => x.textContent.includes(id))?.value, borrowId);
      expect(option).toBeTruthy();
      await adminPage.locator('select[name="borrowId"]').selectOption(option);
      await adminPage.locator('input[name="condition"]').first().check();
      await adminPage.getByRole('button', { name: 'ยืนยันการคืนอุปกรณ์' }).click();
      await adminPage.getByRole('button', { name: 'ยืนยันตรวจรับ' }).click();
      returned = true;

      await page.goto('/member/history?tab=borrow');
      const row = page.locator('tr').filter({ hasText: borrowId });
      await expect(row).toContainText('คืนแล้ว');
    } finally {
      if (borrowId && !returned) {
        try {
          await adminPage.goto('/admin/returns');
          await adminPage.getByRole('button', { name: 'บันทึกรับคืน' }).click();
          const option = await adminPage.locator('select[name="borrowId"] option').evaluateAll((xs, id) => xs.find(x => x.textContent.includes(id))?.value, borrowId);
          if (option) {
            await adminPage.locator('select[name="borrowId"]').selectOption(option);
            await adminPage.locator('input[name="condition"]').first().check();
            await adminPage.getByRole('button', { name: 'ยืนยันการคืนอุปกรณ์' }).click();
            await adminPage.getByRole('button', { name: 'ยืนยันตรวจรับ' }).click();
          } else {
            await adminPage.goto('/admin/borrows');
            await adminPage.getByRole('button', { name: 'จัดการคำขอ' }).click();
            await adminPage.getByRole('button', { name: 'ยกเลิกคำขอ' }).click();
            await adminPage.getByPlaceholder('ระบุเหตุผลการยกเลิกรายการ').fill('QA Playwright cleanup');
            await adminPage.getByRole('button', { name: 'ยืนยันการยกเลิก' }).click();
          }
        } catch (error) {
          console.error(`Cleanup needed for ${borrowId}: ${error.message}`);
        }
      }
      await adminContext.close();
    }
  });
});
