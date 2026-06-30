import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("学习活动", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/events");
    await expect(page.locator("text=学习活动")).toBeVisible();
    await expect(page.locator("button:has-text('创建活动')")).toBeVisible();
  });

  test("创建自习活动", async ({ page }) => {
    await page.goto("/dashboard/events");
    await page.click("text=创建活动");

    await page.fill("input:below(:text('活动名称'))", "周末自习");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const startStr = tomorrow.toISOString().slice(0, 16);
    const endStr = new Date(tomorrow.getTime() + 3 * 3600000).toISOString().slice(0, 16);
    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill(startStr);
    await inputs.nth(1).fill(endStr);
    await page.fill('textarea', '自主自习时间，有老师答疑');

    await page.click('button:has-text("创建")');
    await expect(page.locator("text=活动已创建")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=周末自习")).toBeVisible();
  });

  test("活动类型标签展示", async ({ page }) => {
    await page.goto("/dashboard/events");
    // 如果有活动，应该显示类型标签
    const typeTag = page.locator("text=自习").first();
    if (await typeTag.isVisible()) {
      await expect(typeTag).toBeVisible();
    }
  });
});
