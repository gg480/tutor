import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("学员周报", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("周报页面展示", async ({ page }) => {
    await page.goto("/dashboard/weekly");
    await expect(page.locator("text=学员周报")).toBeVisible();
    await expect(page.locator("text=选择学生")).toBeVisible();
    await expect(
      page.locator('button:has-text("生成本周周报")')
    ).toBeVisible();
  });

  test("生成本周周报", async ({ page }) => {
    // 确保有学生和学情数据
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      // 创建一些学情数据
      await page.goto("/dashboard/records");
      await page.click("text=记录学情");
      await page.waitForSelector('h3:has-text("记录学情")', { timeout: 3000 });
      await page.selectOption("select:below(:text('学生'))", {
        label: "测试学生张三",
      });
      await page.fill("textarea", "本周学习状态良好，函数概念初步建立");
      await page.selectOption("select:below(:text('掌握度'))", "4");
      await page.selectOption("select:below(:text('学习状态'))", "good");
      await page.click('button:has-text("保存记录")');
      await page.waitForSelector("text=学情记录已保存", { timeout: 5000 });
    }

    // 生成周报
    await page.goto("/dashboard/weekly");
    await page.selectOption("select:below(:text('选择学生'))", {
      label: "测试学生张三",
    });
    await page.fill('input[placeholder="如：继续强化一元一次方程应用题"]', "继续强化函数思维训练");
    await page.click('button:has-text("生成本周周报")');

    await expect(page.locator("text=周报已生成")).toBeVisible({
      timeout: 5000,
    });

    // 验证周报内容展示
    await expect(page.locator("text=本周课时").first()).toBeVisible();
    await expect(page.locator("text=平均掌握度").first()).toBeVisible();
    await expect(page.locator("text=下周计划")).toBeVisible();
    await expect(
      page.locator("text=继续强化函数思维训练")
    ).toBeVisible();
  });

  test("空状态提示", async ({ page }) => {
    await page.goto("/dashboard/weekly");
    // 不选学生，直接看空状态
    await expect(page.locator("text=还没有周报").first()).toBeVisible();
  });
});
