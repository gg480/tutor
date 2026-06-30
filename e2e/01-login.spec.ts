import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("登录流程", () => {
  test("未登录时重定向到登录页", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("使用正确账号登录成功", async ({ page }) => {
    await login(page);
    // 验证工作台页面加载成功
    await expect(page.locator("text=欢迎回来")).toBeVisible();
    await expect(page.locator("text=拾步")).toBeVisible();
    // 验证统计卡片可见
    await expect(page.locator("text=在读学生")).toBeVisible();
    await expect(page.locator("text=今日课程")).toBeVisible();
    // 验证侧边栏导航（11项完整）
    const navItems = ["通知中心","学生管理","排课日历","课程包","业财看板","月度收入","试听管理","AI学案","知识点","每日学情","错题管理","错题复习","成绩曲线","学员周报","竞赛成果","学习报告","学期总结","学习活动","数据总览","操作日志","系统设置","新手上路","更新日志"];
    for (const item of navItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible();
    }
  });

  test("使用错误密码登录失败", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // 验证错误提示
    await expect(page.locator("text=邮箱或密码错误")).toBeVisible();
  });

  test("退出登录功能", async ({ page }) => {
    await login(page);
    await page.click("text=退出登录");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });
});
