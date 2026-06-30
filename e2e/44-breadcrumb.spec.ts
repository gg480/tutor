import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("面包屑导航", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("工作台不显示面包屑", async ({ page }) => {
    await page.goto("/dashboard");
    // 只有一段路径时，不显示面包屑
    const breadcrumb = page.locator("nav[aria-label='面包屑导航']");
    await expect(breadcrumb).toHaveCount(0);
  });

  test("学生管理页显示面包屑", async ({ page }) => {
    await page.goto("/dashboard/students");
    const breadcrumb = page.locator("nav[aria-label='面包屑导航']");
    await expect(breadcrumb).toBeVisible();
    await expect(page.locator("text=学生管理").first()).toBeVisible();
  });

  test("学生详情页显示多级面包屑", async ({ page }) => {
    // 先创建一个学生
    await page.goto("/dashboard/students/new");
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill("面包屑测试学生");
      await page.selectOption('select[name="grade"]', "初一");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard\/students\//, { timeout: 5000 });
    }

    // 验证面包屑
    const breadcrumb = page.locator("nav[aria-label='面包屑导航']");
    await expect(breadcrumb).toBeVisible();
    await expect(page.locator("text=学生管理").first()).toBeVisible();
  });

  test("面包屑子页面中文映射", async ({ page }) => {
    await page.goto("/dashboard/finance");
    const breadcrumb = page.locator("nav[aria-label='面包屑导航']");
    await expect(breadcrumb).toBeVisible();
    // 应显示中文
    await expect(page.locator("text=业财看板").first()).toBeVisible();
  });
});
