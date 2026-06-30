import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("成绩曲线", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("成绩页面展示", async ({ page }) => {
    await page.goto("/dashboard/scores");
    await expect(page.locator("text=成绩曲线")).toBeVisible();
    await expect(page.locator("button:has-text('录入成绩')")).toBeVisible();
  });

  test("录入成绩", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/scores");
    await page.click("text=录入成绩");
    await page.waitForSelector('h3:has-text("录入成绩")', { timeout: 3000 });

    // 选择学生
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });

    // 填写考试信息
    await page.fill('input[placeholder="期中/月考/竞赛"]', "期中考试");
    await page.fill('input[placeholder="数学"]', "数学");
    await page.fill('input[type="number"]:below(:text("得分"))', "85");
    await page.fill('input[placeholder="班级第5名"]', "班级第8名");

    await page.click('button:has-text("保存成绩")');
    await expect(page.locator("text=成绩已记录")).toBeVisible({
      timeout: 5000,
    });

    // 验证成绩出现在列表中
    await expect(page.locator("text=期中考试")).toBeVisible();
    await expect(page.locator("text=85")).toBeVisible();
    await expect(page.locator("text=班级第8名")).toBeVisible();
  });
});
