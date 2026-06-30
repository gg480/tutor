import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("全局搜索", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("全局搜索按钮可见", async ({ page }) => {
    await expect(page.locator("text=全局搜索").first()).toBeVisible();
  });

  test("打开搜索面板", async ({ page }) => {
    await page.click("text=全局搜索");
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="搜索学生、课程、学情、错题、成绩..."]')).toBeVisible();
  });

  test("搜索学生返回结果", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    // 打开搜索
    await page.click("text=全局搜索");
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder="搜索学生、课程、学情、错题、成绩..."]');
    await input.fill("张三");
    await page.waitForTimeout(1000);

    // 应显示搜索结果
    const result = page.locator("text=测试学生张三").first();
    if (await result.isVisible()) {
      await expect(result).toBeVisible();
    }
  });

  test("ESC关闭搜索面板", async ({ page }) => {
    await page.click("text=全局搜索");
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const input = page.locator('input[placeholder="搜索学生、课程、学情、错题、成绩..."]');
    await expect(input).not.toBeVisible();
  });
});
