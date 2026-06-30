import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("批量导入学生", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("导入页面展示", async ({ page }) => {
    await page.goto("/dashboard/import");
    await expect(page.locator("text=批量导入学生")).toBeVisible();
    await expect(page.locator("text=操作步骤")).toBeVisible();
    await expect(page.locator("text=粘贴CSV数据")).toBeVisible();
  });

  test("批量导入按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    await expect(page.locator('a:has-text("批量导入")')).toBeVisible();
  });

  test("点击填入示例数据", async ({ page }) => {
    await page.goto("/dashboard/import");
    await page.click("text=点击填入示例数据");
    // 验证textarea被填充
    const textarea = page.locator("textarea");
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(50);
    expect(value).toContain("张三");
  });

  test("预览CSV数据", async ({ page }) => {
    await page.goto("/dashboard/import");
    await page.click("text=点击填入示例数据");
    await page.click("text=预览数据");
    await page.waitForTimeout(1000);
    // 验证预览表格
    await expect(page.locator("text=张三").first()).toBeVisible();
    await expect(page.locator("text=实验中学").first()).toBeVisible();
  });
});
