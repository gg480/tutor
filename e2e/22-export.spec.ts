import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("数据导出CSV", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("学生列表导出按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    await expect(page.locator('a:has-text("导出CSV")')).toBeVisible();
  });

  test("学情记录导出按钮可见", async ({ page }) => {
    await page.goto("/dashboard/records");
    await expect(page.locator('a:has-text("导出CSV")')).toBeVisible();
  });

  test("错题导出按钮可见", async ({ page }) => {
    await page.goto("/dashboard/mistakes");
    await expect(page.locator('a:has-text("导出CSV")')).toBeVisible();
  });

  test("成绩导出按钮可见", async ({ page }) => {
    await page.goto("/dashboard/scores");
    await expect(page.locator('a:has-text("导出CSV")')).toBeVisible();
  });

  test("导出学生列表CSV", async ({ page }) => {
    // 直接请求导出API
    const response = await page.request.get("/api/export?type=students");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"] || "";
    expect(contentType).toContain("text/csv");

    const text = await response.text();
    // CSV应该有表头行
    expect(text).toContain("姓名");
    expect(text).toContain("年级");
    expect(text).toContain("状态");
    console.log(`✅ CSV导出成功，${text.split("\n").length - 1} 行数据`);
  });

  test("导出学情记录CSV", async ({ page }) => {
    const response = await page.request.get("/api/export?type=records");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("学生");
    expect(text).toContain("掌握度");
  });
});
