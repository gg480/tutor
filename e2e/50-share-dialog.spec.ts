import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("分享链接对话框", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("分享按钮点击打开对话框", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("button:has-text('分享')");

    // 对话框应出现
    await expect(page.locator("text=分享学情给家长")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button:has-text('复制')")).toBeVisible();
  });

  test("对话框显示分享链接", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("button:has-text('分享')");
    await page.waitForTimeout(1000);

    // 链接输入框可见
    const input = page.locator('input[readonly]');
    await expect(input).toBeVisible();
    const value = await input.inputValue();
    expect(value).toContain("localhost:3000/parent/");
  });

  test("关闭按钮关闭对话框", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("button:has-text('分享')");
    await page.waitForTimeout(500);

    await page.click("text=关闭");
    await page.waitForTimeout(300);
    await expect(page.locator("text=分享学情给家长")).not.toBeVisible();
  });
});
