import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("导航搜索", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("搜索框可见", async ({ page }) => {
    await expect(page.locator('input[placeholder="搜索页面..."], button:has-text("搜索页面")').first()).toBeVisible();
  });

  test("点击搜索框打开面板（通过按钮）", async ({ page }) => {
    await page.click("text=搜索页面");
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="搜索页面..."]').first()).toBeVisible();
  });

  test("输入关键词过滤页面", async ({ page }) => {
    await page.click("text=搜索页面");
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder="搜索页面..."]').first();
    await input.fill("学生");

    // 应显示学生管理
    await expect(page.locator("text=学生管理").first()).toBeVisible();
  });

  test("选择搜索结果跳转", async ({ page }) => {
    await page.click("text=搜索页面");
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder="搜索页面..."]').first();
    await input.fill("财务");

    const financeItem = page.locator("button:has-text('业财看板')");
    if (await financeItem.isVisible()) {
      await financeItem.click();
      await page.waitForURL(/\/dashboard\/finance/);
      expect(page.url()).toContain("/dashboard/finance");
    }
  });

  test("ESC关闭搜索面板", async ({ page }) => {
    await page.click("text=搜索页面");
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    // 面板应关闭（输入框不可见）
    const visibleInput = page.locator('input[placeholder="搜索页面..."]').first();
    await expect(visibleInput).not.toBeVisible();
  });
});
