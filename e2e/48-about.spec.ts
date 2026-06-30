import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("关于页面", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/about");
    await expect(page.locator("text=关于 OPC Tutor Suite")).toBeVisible();
    await expect(page.locator("text=版本信息")).toBeVisible();
    await expect(page.locator("text=功能统计")).toBeVisible();
  });

  test("显示版本号", async ({ page }) => {
    await page.goto("/dashboard/about");
    await expect(page.locator("text=v0.1.0")).toBeVisible();
  });

  test("链接可点击", async ({ page }) => {
    await page.goto("/dashboard/about");
    await expect(page.locator('a:has-text("项目文档")').first()).toBeVisible();
  });
});
