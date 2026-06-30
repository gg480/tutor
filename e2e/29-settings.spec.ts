import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("系统设置", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示账号信息", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=系统设置")).toBeVisible();
    await expect(page.locator("text=账号信息")).toBeVisible();
    await expect(page.locator("text=修改密码")).toBeVisible();
    await expect(page.locator("text=系统信息")).toBeVisible();
  });

  test("展示用户邮箱", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=admin@shibu.com")).toBeVisible();
  });

  test("密码修改表单可见", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("修改密码")')).toBeVisible();
  });

  test("系统信息统计展示", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=学生总数").first()).toBeVisible();
    await expect(page.locator("text=课程总数").first()).toBeVisible();
    await expect(page.locator("text=运行环境").first()).toBeVisible();
  });
});
