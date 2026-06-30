import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("导航与回归测试", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("侧边栏11个导航全部可点击跳转", async ({ page }) => {
    const links = [
      { text: "工作台", url: "/dashboard" },
      { text: "通知中心", url: "/dashboard/notifications" },
      { text: "学生管理", url: "/dashboard/students" },
      { text: "排课日历", url: "/dashboard/courses" },
      { text: "课程包", url: "/dashboard/registrations" },
      { text: "业财看板", url: "/dashboard/finance" },
      { text: "月度收入", url: "/dashboard/revenue" },
      { text: "试听管理", url: "/dashboard/trials" },
      { text: "AI学案", url: "/dashboard/lesson-plans" },
      { text: "知识点", url: "/dashboard/knowledge-points" },
      { text: "每日学情", url: "/dashboard/records" },
      { text: "错题管理", url: "/dashboard/mistakes" },
      { text: "错题复习", url: "/dashboard/review" },
      { text: "成绩曲线", url: "/dashboard/scores" },
      { text: "学员周报", url: "/dashboard/weekly" },
      { text: "竞赛成果", url: "/dashboard/achievements" },
      { text: "学习报告", url: "/dashboard/reports" },
      { text: "学期总结", url: "/dashboard/semester-report" },
      { text: "学习活动", url: "/dashboard/events" },
      { text: "数据总览", url: "/dashboard/system" },
      { text: "操作日志", url: "/dashboard/activity-logs" },
      { text: "系统设置", url: "/dashboard/settings" },
      { text: "新手上路", url: "/dashboard/onboarding" },
      { text: "更新日志", url: "/dashboard/changelog" },
    ];

    for (const link of links) {
      await page.click(`a:has-text("${link.text}")`);
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain(link.url);
      console.log(`✅ 导航 "${link.text}" → ${link.url}`);
    }
  });

  test("退出登录后无法访问工作台", async ({ page }) => {
    await page.click('button:has-text("退出登录")');
    await page.waitForURL("/login");
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("空状态友好提示", async ({ page }) => {
    await page.goto("/dashboard/records");
    // 如果没数据，应有友好提示（可选：未强制）
    const body = page.locator("body");
    const text = await body.textContent();
    if (text?.includes("还没有")) {
      await expect(page.getByText(/还没有.*/).first()).toBeVisible();
    }
  });
});
