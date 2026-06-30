import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("版本更新日志", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/changelog");
    await expect(page.locator("text=版本更新日志")).toBeVisible();
    await expect(page.locator("text=总迭代轮次").first()).toBeVisible();
  });

  test("显示35轮迭代", async ({ page }) => {
    await page.goto("/dashboard/changelog");
    // 应有多轮迭代条目
    const rounds = page.locator("text=R1").first();
    await expect(rounds).toBeVisible();
    await expect(page.locator("text=R35").first()).toBeVisible();
  });

  test("分类标签展示", async ({ page }) => {
    await page.goto("/dashboard/changelog");
    await expect(page.locator("text=功能").first()).toBeVisible();
    await expect(page.locator("text=里程碑").first()).toBeVisible();
  });
});
