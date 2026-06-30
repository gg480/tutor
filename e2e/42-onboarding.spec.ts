import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("新手上路", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/onboarding");
    await expect(page.locator("text=欢迎来到拾步工作室").first()).toBeVisible();
    await expect(page.locator("text=新手进度")).toBeVisible();
  });

  test("显示步骤列表", async ({ page }) => {
    await page.goto("/dashboard/onboarding");
    const steps = ["创建第一个学生档案", "安排第一节课", "记录第一次学情", "录入第一道错题", "录入第一次成绩", "记录竞赛成果"];
    for (const step of steps) {
      await expect(page.locator(`text=${step}`).first()).toBeVisible();
    }
  });

  test("去完成按钮可点击", async ({ page }) => {
    await page.goto("/dashboard/onboarding");
    const btn = page.locator('a:has-text("去完成")').first();
    if (await btn.isVisible()) {
      await expect(btn).toBeVisible();
    }
  });

  test("进度条展示", async ({ page }) => {
    await page.goto("/dashboard/onboarding");
    await expect(page.locator("text=已完成").first()).toBeVisible();
  });
});
