import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("骨架屏加载", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("学生列表页加载时显示骨架屏", async ({ page }) => {
    // 用较慢的网络模拟
    await page.context().route("**/api/students**", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto("/dashboard/students");
    // 骨架屏应该有动画效果（animate-pulse类）
    const skeleton = page.locator(".animate-pulse").first();
    await expect(skeleton).toBeVisible({ timeout: 2000 });
  });

  test("课程页骨架屏可见", async ({ page }) => {
    await page.context().route("**/api/courses**", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto("/dashboard/courses");
    const skeleton = page.locator(".animate-pulse").first();
    await expect(skeleton).toBeVisible({ timeout: 2000 });
  });
});
