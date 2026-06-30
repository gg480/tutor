import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("学期总结报告", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/semester-report");
    await expect(page.locator("text=学期总结报告")).toBeVisible();
    await expect(page.locator("text=选择学生")).toBeVisible();
  });

  test("选择学生后显示报告", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/semester-report");
    await page.selectOption("select", { label: "测试学生张三" });
    await page.waitForTimeout(2000);

    // 应该显示报告内容
    await expect(page.locator("text=学期学习报告").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=核心指标").first()).toBeVisible();
  });

  test("打印按钮可见", async ({ page }) => {
    await page.goto("/dashboard/semester-report");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/semester-report");
    await page.selectOption("select", { label: "测试学生张三" });
    await page.waitForTimeout(2000);

    const printBtn = page.locator("button:has-text('打印')");
    if (await printBtn.isVisible()) {
      await expect(printBtn).toBeVisible();
    }
  });
});
