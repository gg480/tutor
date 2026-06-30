import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("错题管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("错题管理页面展示", async ({ page }) => {
    await page.goto("/dashboard/mistakes");
    await expect(page.locator("text=错题管理")).toBeVisible();
    await expect(page.locator("button:has-text('录入错题')")).toBeVisible();
    // 验证筛选下拉框
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("录入错题 — 概念不清类型", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/mistakes");
    await page.click("text=录入错题");
    await page.waitForSelector('h3:has-text("录入错题")', { timeout: 3000 });

    // 选择学生
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });
    await page.fill('input[placeholder="如：数学"]', "数学");

    // 选择错因：概念不清
    await page.click('button:has-text("概念不清")');

    // 填写错题内容
    const mistakeContent =
      "已知 2x + 3 = 7，求 x 的值。学生答：x = 5（错误，应为 x = 2）";
    await page.fill("textarea", mistakeContent);

    // 错误答案和正确答案
    await page.fill(
      'textarea:below(:text("学生的错误答案"))',
      "x = 5"
    );
    await page.fill('textarea:below(:text("正确答案"))', "x = 2");

    await page.click('button:has-text("保存错题")');
    await expect(page.locator("text=错题已记录")).toBeVisible({
      timeout: 5000,
    });

    // 验证错题出现在列表中
    await expect(page.locator("text=测试学生张三")).toBeVisible();
    await expect(page.locator("text=概念不清")).toBeVisible();
    await expect(page.locator("text=待解决")).toBeVisible();
  });

  test("错题状态更新 — 标记已掌握", async ({ page }) => {
    await page.goto("/dashboard/mistakes");

    // 如果存在可标记的错题
    const markBtn = page
      .locator("button")
      .filter({ hasText: "标记已掌握" })
      .first();
    if (await markBtn.isVisible()) {
      await markBtn.click();
      await expect(page.locator("text=状态已更新")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
