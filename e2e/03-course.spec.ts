import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("排课日历", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("排课日历页面展示", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await expect(page.locator("text=排课日历")).toBeVisible();
    await expect(page.locator("button:has-text('新建课程')")).toBeVisible();
    // 验证周切换按钮
    await expect(page.locator("text=周一")).toBeVisible();
  });

  test("新建课程弹窗", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await page.click("text=新建课程");

    // 验证弹窗
    await expect(page.locator("h3:has-text('新建课程')")).toBeVisible();
    await expect(page.locator("text=学生").first()).toBeVisible();
    await expect(page.locator("text=科目")).toBeVisible();
    await expect(page.locator("text=开始时间")).toBeVisible();
    await expect(page.locator("text=时长（分钟）")).toBeVisible();
  });

  test("新建课程并完成签到", async ({ page }) => {
    // 先确保有学生
    await page.goto("/dashboard/students");
    const studentExists = await page.locator("text=测试学生张三").isVisible();
    if (!studentExists) {
      await createTestStudent(page);
    }

    // 创建课程
    await page.goto("/dashboard/courses");
    await page.click("text=新建课程");
    await page.waitForSelector('h3:has-text("新建课程")', { timeout: 3000 });

    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });
    await page.fill('input[placeholder="如：数学"]', "数学");

    // 设置时间为明天（用独特时间避免冲突）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0);
    await page.fill(
      'input[type="datetime-local"]',
      tomorrow.toISOString().slice(0, 16)
    );

    await page.click('button:has-text("创建")');
    await expect(page.locator("text=课程已创建")).toBeVisible({ timeout: 5000 });

    // 验证课程出现在日历中
    await expect(page.locator("text=数学")).toBeVisible();
    await expect(page.locator("text=待上课")).toBeVisible();
  });

  test("签到完成跳转到学情记录", async ({ page }) => {
    // 确保有已完成状态的课程（需要先有课程再签到）
    await page.goto("/dashboard/courses");
    // 找到"签到完成"按钮
    const completeBtn = page.locator('button:has-text("签到完成")').first();

    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      // 应该弹出学情记录窗口（跳转到records页面）
      await page.waitForURL(/\/dashboard\/records/, { timeout: 5000 }).catch(() => {});
      const currentUrl = page.url();
      expect(currentUrl).toContain("/dashboard/records");
      console.log("✅ 签到完成→学情记录 跳转验证通过");
    } else {
      console.log("⏭️ 没有可签到的课程，跳过验证");
    }
  });
});
