import { test, expect } from "@playwright/test";
import {
  login,
  createTestStudent,
  createDailyRecord,
  createMistake,
  createScore,
} from "./helpers";

test.describe("业务全流程", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("完整场景：建档→排课→学情→错题→成绩→报告", async ({ page }) => {
    // 1. 新建学生
    await createTestStudent(page);
    await expect(page.locator("text=测试学生张三")).toBeVisible();
    console.log("✅ 1/6 学生建档");

    // 2. 排课
    await page.goto("/dashboard/courses");
    await page.click("text=新建课程");
    await page.waitForSelector('h3:has-text("新建课程")', { timeout: 3000 });
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });
    await page.fill('input[placeholder="如：数学"]', "数学");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    await page.fill(
      'input[type="datetime-local"]',
      tomorrow.toISOString().slice(0, 16)
    );
    await page.click('button:has-text("创建")');
    await expect(page.locator("text=课程已创建")).toBeVisible({ timeout: 5000 });
    console.log("✅ 2/6 排课");

    // 3. 记录学情
    await createDailyRecord(
      page,
      "测试学生张三",
      "函数概念初步建立，应用题列方程还需加强"
    );
    console.log("✅ 3/6 学情");

    // 4. 录入错题
    await createMistake(
      page,
      "测试学生张三",
      "数学",
      "2x+3=7 学生答x=5，应为x=2"
    );
    console.log("✅ 4/6 错题");

    // 5. 录入成绩
    await createScore(page, "测试学生张三", "期中考试", 85);
    console.log("✅ 5/6 成绩");

    // 6. 查看学习报告
    await page.goto("/dashboard/reports");
    await expect(page.locator("text=学习报告")).toBeVisible();
    // 点击学生进入报告
    const studentLink = page.locator("button", { hasText: "测试学生张三" });
    if (await studentLink.isVisible()) {
      await studentLink.click();
      await expect(page.locator("text=学情概况")).toBeVisible({ timeout: 5000 });
    }
    console.log("✅ 6/6 报告");
  });

  test("Dashboard展示正确的5个统计卡片", async ({ page }) => {
    await page.goto("/dashboard");
    // 5个卡片标题
    for (const label of [
      "在读学生",
      "今日课程",
      "待处理错题",
      "学情记录",
      "本周周报",
    ]) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
    // 掌握度趋势图表区
    await expect(page.locator("text=掌握度趋势（近14天）")).toBeVisible();
    await expect(page.locator("text=掌握度分布")).toBeVisible();
    // 快捷操作
    for (const btn of ["新建学生", "添加课程", "记学情", "录错题", "生成周报"]) {
      await expect(page.locator(`text=${btn}`).first()).toBeVisible();
    }
    // 最近动态区块
    await expect(page.locator("text=最近动态")).toBeVisible();
  });
});
