import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("月度收入报表", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示核心指标", async ({ page }) => {
    await page.goto("/dashboard/revenue");
    await expect(page.locator("text=月度收入报表")).toBeVisible();
    await expect(page.locator("text=累计确认收入").first()).toBeVisible();
    await expect(page.locator("text=已完成课程").first()).toBeVisible();
  });

  test("预收款余额展示", async ({ page }) => {
    await page.goto("/dashboard/revenue");
    await expect(page.locator("text=预收款是负债不是利润")).toBeVisible();
  });

  test("月度明细表可见", async ({ page }) => {
    await page.goto("/dashboard/revenue");
    await expect(page.locator("text=月度明细")).toBeVisible();
    // 表头
    await expect(page.locator("text=确认收入").first()).toBeVisible();
    await expect(page.locator("text=新增签约").first()).toBeVisible();
  });
});
