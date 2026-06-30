import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("通知中心", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(page.locator("text=通知中心")).toBeVisible();
    await expect(page.locator("text=今日课程")).toBeVisible();
    await expect(page.locator("text=续费预警")).toBeVisible();
    await expect(page.locator("text=待记录学情")).toBeVisible();
  });

  test("今日课程区块展示", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    // 应该有上课节数统计
    const courseSection = page.locator("text=今日课程").first();
    await expect(courseSection).toBeVisible();
  });

  test("续费预警区块展示", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    const alertSection = page.locator("text=续费预警").first();
    await expect(alertSection).toBeVisible();
  });

  test("导航到通知中心", async ({ page }) => {
    await page.click("text=通知中心");
    await page.waitForURL("**/dashboard/notifications");
    expect(page.url()).toContain("/dashboard/notifications");
  });
});
