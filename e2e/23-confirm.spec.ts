import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("确认对话框", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("学生详情页删除按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }
    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await expect(page.locator("button:has-text('删除')")).toBeVisible();
  });

  test("点击删除弹出确认对话框", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("button:has-text('删除')");

    // 确认对话框应弹出
    await expect(page.locator("text=确定要删除")).toBeVisible();
    await expect(page.locator("text=确认删除")).toBeVisible();
    await expect(page.locator("text=取消")).toBeVisible();
  });

  test("取消按钮关闭对话框", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("button:has-text('删除')");

    // 点击取消
    await page.click("text=取消");
    // 对话框应关闭
    await expect(page.locator("text=确定要删除")).not.toBeVisible();
  });
});
