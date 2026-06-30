import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("工作室品牌页", () => {
  test("公开页面可访问（无需登录）", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=拾步工作室").first()).toBeVisible();
    await expect(page.locator("text=教学特色")).toBeVisible();
    await expect(page.locator("text=竞赛成果")).toBeVisible();
    await expect(page.locator("text=联系我们")).toBeVisible();
  });

  test("品牌页展示统计数字", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=在读学员").first()).toBeVisible();
    await expect(page.locator("text=竞赛获奖").first()).toBeVisible();
    await expect(page.locator("text=辅导科目").first()).toBeVisible();
  });

  test("教学特色四个卡片展示", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    const features = ["精准诊断", "双轨制教学", "数据追踪", "竞赛培优"];
    for (const f of features) {
      await expect(page.locator(`text=${f}`).first()).toBeVisible();
    }
  });

  test("导航链接可点击", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    await page.click('a[href="#features"]');
    await expect(page.locator("text=教学特色").first()).toBeVisible();
  });

  test("侧边栏品牌主页链接", async ({ page }) => {
    await login(page);
    await expect(page.locator('a:has-text("品牌主页")')).toBeVisible();
  });
});
