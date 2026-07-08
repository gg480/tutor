import { test, expect, Page } from "@playwright/test";
import { login } from "../helpers";

/**
 * bf-001 登录流程 · 业务流循环评估 round 1/40
 *
 * 业务目标：管理员通过预填账号密码登录系统，未登录访问 dashboard 自动跳转登录页，
 * 登录成功后进入工作台。
 *
 * 验收点（来自 CODE-WIKI A.1 / 4.2.1 / 4.1.4）：
 *   1. 未登录访问 /dashboard/* → useSession() 返回 unauthenticated → redirect("/login")
 *   2. 登录页预填 admin@shibu.com / shibu123456
 *   3. 点击登录 → signIn("credentials", { redirect: false }) → router.push("/dashboard")
 *   4. 工作台显示"欢迎回来"
 */

test.describe("bf-001 登录流程", () => {
  test("未登录访问 /dashboard 自动跳转 /login", async ({ page }: { page: Page }) => {
    try {
      await page.goto("/dashboard");
      // useSession 检测到未登录后应跳转登录页
      await page.waitForURL(/\/login/, { timeout: 15000 });
      expect(page.url()).toContain("/login");
    } catch (err) {
      throw new Error(`未登录访问 /dashboard 未跳转到 /login: ${(err as Error).message}`);
    }
  });

  test("登录页预填管理员账号 admin@shibu.com / shibu123456", async ({ page }: { page: Page }) => {
    try {
      await page.goto("/login");
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // 验证 input 预填默认值（CODE-WIKI A.1：登录页预填管理员账号）
      await expect(emailInput).toHaveValue("admin@shibu.com", { timeout: 5000 });
      await expect(passwordInput).toHaveValue("shibu123456", { timeout: 5000 });

      // 验证页面标题与默认账号提示可见
      await expect(page.locator("text=管理员登录")).toBeVisible();
      await expect(page.locator("text=admin@shibu.com")).toBeVisible();
    } catch (err) {
      throw new Error(`登录页未正确预填账号密码: ${(err as Error).message}`);
    }
  });

  test("使用预填账号登录成功跳转工作台并显示欢迎回来", async ({ page }: { page: Page }) => {
    try {
      await login(page);

      // 验证已跳转到工作台
      expect(page.url()).toContain("/dashboard");

      // 验证工作台显示"欢迎回来"
      await expect(page.locator("text=欢迎回来").first()).toBeVisible({ timeout: 10000 });
    } catch (err) {
      throw new Error(`登录后未成功进入工作台: ${(err as Error).message}`);
    }
  });
});
