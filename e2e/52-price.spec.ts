import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("课程单价显示", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("课程包显示课时单价", async ({ page }) => {
    // 先创建课程包
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/registrations");
    await page.click("text=新建课程包");
    await page.waitForSelector('h3:has-text("新建课程包")', { timeout: 3000 });
    await page.selectOption("select:below(:text('学生'))", { label: "测试学生张三" });
    await page.fill('input[placeholder=\'如："初一数学48课时包"\']', "单价测试包");
    await page.fill('input[type="number"]:below(:text("总课时"))', "48");
    await page.fill('input[type="number"]:below(:text("总价（元）"))', "9600");
    await page.click('button:has-text("创建课程包")');
    await expect(page.locator("text=课程包已创建")).toBeVisible({ timeout: 5000 });

    // 验证显示单价
    await expect(page.locator("text=¥200/课时").first()).toBeVisible();
  });
});
