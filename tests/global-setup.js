const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async () => {
  const roles = [
    ['MEMBER', '/member', 'member.json'],
    ['ADMIN', '/admin', 'admin.json'],
  ].filter(([role]) => process.env[`SB_${role}_EMAIL`] && process.env[`SB_${role}_PASSWORD`]);
  if (!roles.length) return;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  await fs.mkdir(path.join(__dirname, '..', '.auth'), { recursive: true });
  try {
    for (const [role, landing, filename] of roles) {
      const statePath = path.join(__dirname, '..', '.auth', filename);
      if (process.env.SB_REUSE_SESSION === '1') {
        try {
          await fs.access(statePath);
          continue;
        } catch {}
      }
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('https://sportborrow.inprojex.tech/login');
      await page.locator('input[name="email"]').fill(process.env[`SB_${role}_EMAIL`]);
      await page.locator('input[name="password"]').fill(process.env[`SB_${role}_PASSWORD`]);
      await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
      try {
        await page.waitForURL(new RegExp(`${landing}(?:$|/)`), { timeout: 15000 });
      } catch {
        const message = (await page.locator('body').innerText()).match(/ทำรายการบ่อยเกินไป|อีเมลหรือรหัสผ่านไม่ถูกต้อง|ยืนยันอีเมล/);
        throw new Error(`${role} login failed${message ? ': ' + message[0] : ''}`);
      }
      await context.storageState({ path: statePath });
      await context.close();
    }
  } finally {
    await browser.close();
  }
};
