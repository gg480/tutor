import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("批量排课", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("批量排课按钮可见", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await expect(page.locator("button:has-text('批量排课')")).toBeVisible();
  });

  test("批量排课弹窗展示", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await page.click("text=批量排课");
    await expect(page.locator("h3:has-text('批量排课')")).toBeVisible();
    // 选择星期按钮
    await expect(page.locator("button:has-text('一')")).toBeVisible();
    await expect(page.locator("button:has-text('三')")).toBeVisible();
    await expect(page.locator("button:has-text('五')")).toBeVisible();
  });

  test("选择星期功能", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await page.click("text=批量排课");
    await page.waitForTimeout(500);

    // 点击周一和周三
    await page.click("button:has-text('一')");
    await page.click("button:has-text('三')");

    // 确认按钮背景变化（选中状态）
    const mondayBtn = page.locator("button:has-text('一')");
    const bgClass = await mondayBtn.getAttribute("class");
    expect(bgClass).toContain("bg-shibu");
  });
});
