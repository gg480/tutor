import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("课程日历导出 iCal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("导出日历按钮可见", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await expect(page.locator('a:has-text("导出日历")')).toBeVisible();
  });

  test("导出iCal文件", async ({ page }) => {
    // 直接请求API
    const response = await page.request.get("/api/calendar");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"] || "";
    expect(contentType).toContain("text/calendar");

    const text = await response.text();
    // iCal标准格式验证
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("VERSION:2.0");
    expect(text).toContain("END:VCALENDAR");
    expect(text).toContain("拾步课程表");
    console.log(`✅ iCal导出成功，${text.length} 字符`);
  });
});
