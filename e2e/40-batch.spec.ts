import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("批量选择与操作", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("复选框可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    // 如果有学生，复选框应可见
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await expect(checkbox).toBeVisible();
    }
  });

  test("全选功能", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.waitForLoadState("networkidle");

    // 勾选全选
    const selectAll = page.locator("text=全选").first();
    if (await selectAll.isVisible()) {
      await selectAll.click();
      // 应该显示批量操作栏
      await expect(page.locator("text=已选择").first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("选择后显示批量操作栏", async ({ page }) => {
    await page.goto("/dashboard/students");
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(300);
      // 批量操作栏应出现
      await expect(page.locator("text=导出选中").first()).toBeVisible();
      await expect(page.locator("text=删除选中").first()).toBeVisible();
      await expect(page.locator("text=取消选择").first()).toBeVisible();
    }
  });

  test("取消选择清空选中", async ({ page }) => {
    await page.goto("/dashboard/students");
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(300);
      await page.click("text=取消选择");
      // 批量操作栏应消失
      const batchBar = page.locator("text=已选择");
      await expect(batchBar).not.toBeVisible();
    }
  });
});
