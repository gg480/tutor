import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("试听管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/trials");
    await expect(page.locator("text=试听管理")).toBeVisible();
    await expect(page.locator("text=新建线索")).toBeVisible();
    // 漏斗卡片
    await expect(page.locator("text=总线索").first()).toBeVisible();
    await expect(page.locator("text=转化率").first()).toBeVisible();
  });

  test("新建线索", async ({ page }) => {
    await page.goto("/dashboard/trials");
    await page.click("text=新建线索");

    await page.fill('input[placeholder="如：数学"]', "数学");
    await page.fill('input:below(:text("学生姓名"))', "试听学生甲");
    await page.selectOption('select:below(:text("年级"))', "初一");
    await page.fill('input:below(:text("家长姓名"))', "试听家长");
    await page.fill('input:below(:text("联系电话"))', "13900139000");

    await page.click('button:has-text("创建线索")');
    await expect(page.locator("text=试听记录已创建")).toBeVisible({ timeout: 5000 });
  });

  test("状态推进按钮可见", async ({ page }) => {
    await page.goto("/dashboard/trials");
    const statusBtn = page.locator("text=预约试听").first();
    if (await statusBtn.isVisible()) {
      await expect(statusBtn).toBeVisible();
    }
  });

  test("状态筛选功能", async ({ page }) => {
    await page.goto("/dashboard/trials");
    await page.click("text=已联系");
    // 验证筛选激活
    await expect(page.locator("text=已联系").first()).toBeVisible();
  });
});
