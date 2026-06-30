import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("系统健康检查", () => {
  test("健康检查API无需登录可访问", async ({ page }) => {
    // 无需登录直接访问
    const response = await page.request.get("/api/health");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.tables).toBeDefined();
    expect(data.checks.data).toBeDefined();
    console.log(`🏥 系统状态: ${data.status}`);
    console.log(`📊 数据概览: ${data.checks.data?.detail || "N/A"}`);
    console.log(`🗄️  数据库表: ${data.checks.tables?.detail || "N/A"}`);
  });

  test("健康检查返回数据库连接状态", async ({ page }) => {
    const response = await page.request.get("/api/health");
    const data = await response.json();
    expect(data.checks.database.status).toBe("ok");
  });

  test("健康检查返回环境信息", async ({ page }) => {
    const response = await page.request.get("/api/health");
    const data = await response.json();
    expect(data.checks.environment).toBeDefined();
    expect(data.checks.environment.detail).toContain("NEXTAUTH_URL");
  });
});
