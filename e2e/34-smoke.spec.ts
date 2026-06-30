import { test, expect } from "@playwright/test";
import { login, createTestStudent, createDailyRecord, createMistake, createScore } from "./helpers";

test.describe("全局冒烟测试", () => {
  test("所有核心页面可加载", async ({ page }) => {
    await login(page);

    const pages = [
      { path: "/dashboard", name: "工作台" },
      { path: "/dashboard/notifications", name: "通知中心" },
      { path: "/dashboard/students", name: "学生管理" },
      { path: "/dashboard/courses", name: "排课日历" },
      { path: "/dashboard/registrations", name: "课程包" },
      { path: "/dashboard/finance", name: "业财看板" },
      { path: "/dashboard/revenue", name: "月度收入" },
      { path: "/dashboard/trials", name: "试听管理" },
      { path: "/dashboard/lesson-plans", name: "AI学案" },
      { path: "/dashboard/records", name: "每日学情" },
      { path: "/dashboard/mistakes", name: "错题管理" },
      { path: "/dashboard/review", name: "错题复习" },
      { path: "/dashboard/scores", name: "成绩曲线" },
      { path: "/dashboard/weekly", name: "学员周报" },
      { path: "/dashboard/achievements", name: "竞赛成果" },
      { path: "/dashboard/reports", name: "学习报告" },
      { path: "/dashboard/events", name: "学习活动" },
      { path: "/dashboard/system", name: "数据总览" },
      { path: "/dashboard/activity-logs", name: "操作日志" },
      { path: "/dashboard/settings", name: "系统设置" },
      { path: "/dashboard/changelog", name: "更新日志" },
      { path: "/dashboard/onboarding", name: "新手上路" },
      { path: "/dashboard/semester-report", name: "学期总结" },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible({ timeout: 5000 });
      console.log(`✅ ${p.name} (${p.path}) — 可正常加载`);
    }
  });

  test("业务核心流程可走通", async ({ page }) => {
    await login(page);

    // 1. 新建学生
    await createTestStudent(page);
    console.log("✅ 1/5 新建学生");

    // 2. 记录学情
    await createDailyRecord(page, "测试学生张三", "冒烟测试：课堂表现良好");
    console.log("✅ 2/5 记录学情");

    // 3. 录入错题
    await createMistake(page, "测试学生张三", "数学", "冒烟测试错题");
    console.log("✅ 3/5 录入错题");

    // 4. 录入成绩
    await createScore(page, "测试学生张三", "月考", 92);
    console.log("✅ 4/5 录入成绩");

    // 5. 查看学生详情
    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await expect(page.locator("text=学情总览")).toBeVisible();
    console.log("✅ 5/5 学生详情");

    console.log("\n🎉 冒烟测试全部通过！");
  });

  test("404页面正常展示", async ({ page }) => {
    await page.goto("/dashboard/nonexistent-page-12345");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=404").first()).toBeVisible();
    await expect(page.locator("text=页面未找到")).toBeVisible();
  });
});
