import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("键盘快捷键", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("快捷键按钮可见", async ({ page }) => {
    // 右下角的快捷键触发按钮
    const btn = page.locator('button[title="快捷键帮助"]');
    await expect(btn).toBeVisible();
  });

  test("点击打开快捷键面板", async ({ page }) => {
    await page.click('button[title="快捷键帮助"]');
    await page.waitForTimeout(500);
    await expect(page.locator("text=键盘快捷键")).toBeVisible();
  });

  test("快捷键面板展示分类", async ({ page }) => {
    await page.click('button[title="快捷键帮助"]');
    await page.waitForTimeout(500);
    await expect(page.locator("text=通用").first()).toBeVisible();
    await expect(page.locator("text=页面").first()).toBeVisible();
    await expect(page.locator("text=操作").first()).toBeVisible();
  });

  test("ESC关闭快捷键面板", async ({ page }) => {
    await page.click('button[title="快捷键帮助"]');
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(page.locator("text=键盘快捷键")).not.toBeVisible();
  });
});
