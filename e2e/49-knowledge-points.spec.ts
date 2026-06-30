import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("知识点管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/knowledge-points");
    await expect(page.locator("text=知识点管理")).toBeVisible();
    await expect(page.locator("button:has-text('新增知识点')")).toBeVisible();
  });

  test("显示数学知识点", async ({ page }) => {
    await page.goto("/dashboard/knowledge-points");
    await expect(page.locator("text=数学").first()).toBeVisible();
    // 应有预置的知识点
    await expect(page.locator("text=有理数").first()).toBeVisible();
  });

  test("新增知识点", async ({ page }) => {
    await page.goto("/dashboard/knowledge-points");
    await page.click("text=新增知识点");
    await page.fill('input[placeholder="如：一元一次方程"]', "测试知识点");
    await page.click('button:has-text("创建")');
    await expect(page.locator("text=知识点已创建")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=测试知识点").first()).toBeVisible();
  });
});
