import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("数据总览", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示核心指标", async ({ page }) => {
    await page.goto("/dashboard/system");
    await expect(page.locator("text=数据总览")).toBeVisible();
    // 核心指标卡片
    await expect(page.locator("text=学生总数").first()).toBeVisible();
    await expect(page.locator("text=课程总数").first()).toBeVisible();
    await expect(page.locator("text=学情记录").first()).toBeVisible();
    await expect(page.locator("text=错题总数").first()).toBeVisible();
  });

  test("本月新增区块可见", async ({ page }) => {
    await page.goto("/dashboard/system");
    await expect(page.locator("text=本月新增")).toBeVisible();
    await expect(page.locator("text=新学生").first()).toBeVisible();
    await expect(page.locator("text=新课程").first()).toBeVisible();
  });

  test("近7日活跃区块可见", async ({ page }) => {
    await page.goto("/dashboard/system");
    await expect(page.locator("text=近7日活跃")).toBeVisible();
  });

  test("核心完成率展示", async ({ page }) => {
    await page.goto("/dashboard/system");
    await expect(page.locator("text=课程完成率")).toBeVisible();
    await expect(page.locator("text=错题掌握率")).toBeVisible();
  });
});
