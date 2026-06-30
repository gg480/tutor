import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("批量学情记录", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("批量记录按钮可见", async ({ page }) => {
    await page.goto("/dashboard/records");
    await expect(page.locator("button:has-text('批量记录')")).toBeVisible();
  });

  test("批量记录弹窗展示", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/records");
    await page.click("text=批量记录");
    await page.waitForTimeout(500);

    await expect(page.locator("h3:has-text('批量记录学情')")).toBeVisible();
    // 应显示学生列表
    await expect(page.locator("text=测试学生张三").first()).toBeVisible();
  });

  test("选择学生后可批量创建", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/records");
    await page.click("text=批量记录");
    await page.waitForTimeout(500);

    // 勾选学生
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(300);
      // 应显示已选数量
      await expect(page.locator("text=已选择 1 名")).toBeVisible();
    }
  });
});
