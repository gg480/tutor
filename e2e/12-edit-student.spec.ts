import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("学生编辑功能", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("编辑按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }
    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await expect(page.locator("text=编辑")).toBeVisible();
  });

  test("编辑学生信息", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=编辑");

    // 验证表单已预填
    await expect(page.locator('input[name="name"]')).toHaveValue("测试学生张三");
    await expect(page.locator('input[name="school"]')).toHaveValue("实验中学");

    // 修改信息
    await page.fill('input[name="name"]', "测试学生张三（已更新）");
    await page.fill('textarea[name="summary"]', "更新后的综合分析");

    await page.click('button:has-text("保存修改")');
    await expect(page.locator("text=学生信息已更新")).toBeVisible({
      timeout: 5000,
    });

    // 验证更新后的名字
    await expect(page.locator("text=测试学生张三（已更新）")).toBeVisible();
  });
});
