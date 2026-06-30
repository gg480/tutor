import { test, expect } from "@playwright/test";
import { login, createTestStudent, createDailyRecord } from "./helpers";

test.describe("学生成长时间线", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("时间线Tab可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await expect(page.locator("text=成长时间线")).toBeVisible();
  });

  test("时间线展示统计数据", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=成长时间线");
    await page.waitForTimeout(2000);

    // 验证统计卡片存在
    await expect(page.locator("text=学习天数").first()).toBeVisible();
    await expect(page.locator("text=平均掌握度").first()).toBeVisible();
  });

  test("时间线事件显示", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      // 先创建一些学情数据
      await createDailyRecord(page, "测试学生张三", "学习进度良好");
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=成长时间线");
    await page.waitForTimeout(2000);

    // 应显示"学生建档"事件
    await expect(page.locator("text=学生建档").first()).toBeVisible();
  });
});
