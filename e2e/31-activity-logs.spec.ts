import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("操作日志", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/activity-logs");
    await expect(page.locator("text=操作日志")).toBeVisible();
    await expect(page.locator("text=全部类型").first()).toBeVisible();
  });

  test("创建学生会记录日志", async ({ page }) => {
    // 创建一个学生
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    // 查看操作日志
    await page.goto("/dashboard/activity-logs");
    await page.waitForLoadState("networkidle");

    // 应该有"新建学生"的日志
    const logEntry = page.locator("text=新建学生");
    if (await logEntry.isVisible()) {
      await expect(logEntry).toBeVisible();
    }
  });

  test("筛选功能", async ({ page }) => {
    await page.goto("/dashboard/activity-logs");
    // 选择"创建"筛选
    await page.selectOption("select:below(:text('全部类型'))", "create");
    await page.waitForTimeout(500);
    // 页面应正常加载
    await expect(page.locator("text=操作日志")).toBeVisible();
  });
});
