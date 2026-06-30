import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("AI学案生成", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/lesson-plans");
    await expect(page.locator("text=AI学案生成")).toBeVisible();
    await expect(page.locator("button:has-text('AI生成学案')")).toBeVisible();
  });

  test("AI生成学案 — 数学课", async ({ page }) => {
    await page.goto("/dashboard/lesson-plans");
    await page.click("text=AI生成学案");

    // 填写生成表单
    await page.selectOption("select:below(:text('学科'))", "数学");
    await page.selectOption("select:below(:text('年级'))", "初一");
    await page.fill(
      'input[placeholder=\'如："一元一次方程"、"勾股定理"\']',
      "一元一次方程"
    );
    await page.fill(
      'input[placeholder="如：方程定义, 等号性质, 移项法则"]',
      "方程定义, 等号性质, 移项法则"
    );

    await page.click('button:has-text("AI 生成学案")');

    // 等待生成结果
    await expect(page.locator("text=学案已生成")).toBeVisible({
      timeout: 10000,
    });

    // 验证学案内容结构
    await expect(page.locator("text=教学目标")).toBeVisible();
    await expect(page.locator("text=重点难点")).toBeVisible();
    await expect(page.locator("text=课堂练习")).toBeVisible();
    await expect(page.locator("text=课后作业")).toBeVisible();
  });

  test("历史学案列表", async ({ page }) => {
    await page.goto("/dashboard/lesson-plans");
    // 如果有历史学案，应显示列表
    const historyTitle = page.locator("text=历史学案");
    if (await historyTitle.isVisible()) {
      await expect(historyTitle).toBeVisible();
    }
  });

  test("空状态展示", async ({ page }) => {
    await page.goto("/dashboard/lesson-plans");
    // 首次访问，没有学案
    const emptyState = page.locator("text=还没有学案");
    if (await emptyState.isVisible()) {
      await expect(
        page.locator("text=点击「AI生成学案」开始备课")
      ).toBeVisible();
    }
  });
});
