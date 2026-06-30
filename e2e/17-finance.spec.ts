import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("业财看板", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("业财看板页面展示", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await expect(page.locator("text=业财看板")).toBeVisible();
    // 核心指标
    await expect(page.locator("text=总预收款")).toBeVisible();
    await expect(page.locator("text=已确认收入")).toBeVisible();
    await expect(page.locator("text=待确认收入（负债）")).toBeVisible();
    await expect(page.locator("text=平均课时单价")).toBeVisible();
  });

  test("续费预警区域可见", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await expect(page.locator("text=续费预警")).toBeVisible();
  });

  test("课程包明细表可见", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await expect(page.locator("text=课程包明细")).toBeVisible();
    // 表头
    await expect(page.locator("text=学生").first()).toBeVisible();
    await expect(page.locator("text=课时")).toBeVisible();
    await expect(page.locator("text=消耗")).toBeVisible();
    await expect(page.locator("text=金额")).toBeVisible();
  });

  test("创建课程包后财务数据更新", async ({ page }) => {
    // 先创建课程包
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
    await page.fill('input[placeholder=\'如："初一数学48课时包"\']', "财务测试包");
    await page.fill('input[type="number"]:below(:text("总课时"))', "48");
    await page.fill('input[type="number"]:below(:text("总价（元）"))', "12800");

    await page.click('button:has-text("创建课程包")');
    await expect(page.locator("text=课程包已创建")).toBeVisible({
      timeout: 5000,
    });

    // 查看财务看板
    await page.goto("/dashboard/finance");
    await page.waitForLoadState("networkidle");

    // 总预收款应该包含新创建的课程包金额
    const prepaymentText = await page.locator("text=¥12,800").first();
    await expect(prepaymentText).toBeVisible();
  });
});
