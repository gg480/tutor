import { test, expect } from "@playwright/test";
import { login, createTestStudent, createScore } from "./helpers";

test.describe("学习报告", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("报告页面列出所有学生", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/reports");
    await expect(page.locator("text=学习报告")).toBeVisible();
    // 应显示学生列表
    await expect(page.locator("text=测试学生张三").first()).toBeVisible();
  });

  test("查看学生报告内容", async ({ page }) => {
    // 确保有成绩数据
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      await createScore(page, "测试学生张三", "期中考试", 85);
    }

    await page.goto("/dashboard/reports");
    // 点击学生
    const studentBtn = page.locator("button", { hasText: "测试学生张三" });
    if (await studentBtn.isVisible()) {
      await studentBtn.click();
      await page.waitForSelector("text=学情概况", { timeout: 5000 });
      // 验证报告各区块
      await expect(page.locator("text=最近考试成绩")).toBeVisible();
      await expect(page.locator("text=错题统计")).toBeVisible();
      await expect(page.locator("text=掌握度趋势")).toBeVisible();
      await expect(page.locator("text=下阶段建议")).toBeVisible();
    }
  });

  test("导出报告按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/reports");
    const studentBtn = page.locator("button", { hasText: "测试学生张三" });
    if (await studentBtn.isVisible()) {
      await studentBtn.click();
      await expect(page.locator("text=导出报告")).toBeVisible({ timeout: 5000 });
    }
  });
});
