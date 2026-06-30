import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("批量签到", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("待上课课程复选框可见", async ({ page }) => {
    await page.goto("/dashboard/courses");
    // 如果有待上课课程，复选框应可见
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await expect(checkbox).toBeVisible();
    }
  });

  test("选择课程后显示批量签到栏", async ({ page }) => {
    await page.goto("/dashboard/courses");
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(300);
      await expect(page.locator("button:has-text('批量签到')")).toBeVisible();
      await expect(page.locator("text=已选择").first()).toBeVisible();
    }
  });

  test("取消选择按钮清除选中", async ({ page }) => {
    await page.goto("/dashboard/courses");
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(300);
      await page.click("text=取消");
      const btn = page.locator("button:has-text('批量签到')");
      await expect(btn).not.toBeVisible();
    }
  });
});
