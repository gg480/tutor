import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("竞赛成果管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("竞赛成果页面展示", async ({ page }) => {
    await page.goto("/dashboard/achievements");
    await expect(page.locator("text=竞赛成果")).toBeVisible();
    await expect(page.locator("button:has-text('记录获奖')")).toBeVisible();
    // 5个级别统计卡片
    await expect(page.locator("text=市级").first()).toBeVisible();
    await expect(page.locator("text=省级").first()).toBeVisible();
  });

  test("记录竞赛获奖", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/achievements");
    await page.click("text=记录获奖");

    // 填写表单
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });
    await page.fill(
      'input[placeholder=\'如："2026年市奥数竞赛三等奖"\']',
      "2026年市奥数竞赛三等奖"
    );
    await page.selectOption("select:below(:text('奖项级别'))", "city");
    await page.fill('input[placeholder="如：市教育局、数学学会"]', "市数学学会");

    await page.click('button:has-text("保存获奖记录")');
    await expect(page.locator("text=竞赛成果已记录")).toBeVisible({
      timeout: 5000,
    });

    // 验证列表中出现
    await expect(page.locator("text=2026年市奥数竞赛三等奖")).toBeVisible();
    await expect(page.locator("text=市级")).toBeVisible();
  });

  test("空状态展示", async ({ page }) => {
    await page.goto("/dashboard/achievements");
    // 如果没有数据，应有空状态提示
    const body = page.locator("body");
    const text = await body.textContent();
    if (text?.includes("还没有")) {
      await expect(page.locator("text=还没有竞赛成果记录")).toBeVisible();
    }
  });
});
