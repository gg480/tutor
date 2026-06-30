import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("课程包管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示 + 空状态", async ({ page }) => {
    await page.goto("/dashboard/registrations");
    await expect(page.locator("text=课程包管理")).toBeVisible();
    await expect(page.locator("button:has-text('新建课程包')")).toBeVisible();
  });

  test("新建48课时课程包", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/registrations");
    await page.click("text=新建课程包");
    await page.waitForSelector('h3:has-text("新建课程包")', { timeout: 3000 });

    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });
    await page.fill('input[placeholder=\'如："初一数学48课时包"\']', "初一数学48课时包");
    await page.fill('input[type="number"]:below(:text("总课时"))', "48");
    await page.fill('input[type="number"]:below(:text("总价（元）"))', "12800");

    await page.click('button:has-text("创建课程包")');
    await expect(page.locator("text=课程包已创建")).toBeVisible({ timeout: 5000 });

    // 验证课时进度
    await expect(page.locator("text=初一数学48课时包")).toBeVisible();
    await expect(page.locator("text=剩余 48 课时")).toBeVisible();
    await expect(page.locator("text=¥12,800")).toBeVisible();
  });

  test("续费功能（增加课时）", async ({ page }) => {
    await page.goto("/dashboard/registrations");
    const pkg = page.locator("text=初一数学48课时包");
    if (await pkg.isVisible()) {
      // 点击续费
      await page.click("text=续费");
      await page.fill('input[placeholder="课时"]', "24");
      await page.fill('input[placeholder="金额（元）"]', "6400");
      await page.click("text=确认续费");
      await expect(page.locator("text=续费成功")).toBeVisible({ timeout: 5000 });
      // 总课时应变为72
      await expect(page.locator("text=剩余 72 课时").first()).toBeVisible();
    }
  });
});
