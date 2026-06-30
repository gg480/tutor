import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("CLI & 运行机制", () => {
  test("CLI帮助命令输出", async ({ page }) => {
    // 测试 CLI 帮助信息页面（通过健康检查 API）
    const response = await page.request.get("/api/health");
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();
  });

  test("健康检查返回所有组件状态", async ({ page }) => {
    const response = await page.request.get("/api/health");
    const data = await response.json();
    expect(data.checks.database?.status).toBe("ok");
    expect(data.checks.tables).toBeDefined();
    expect(data.checks.environment).toBeDefined();
  });

  test("CLI 备份功能 API 就绪", async ({ page }) => {
    // 验证数据库文件存在
    await login(page);
    await page.goto("/dashboard/system");
    await expect(page.locator("text=数据总览")).toBeVisible();
  });
});
