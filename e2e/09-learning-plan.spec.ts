import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("双轨制学习计划", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("双轨制计划页面展示", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=双轨制计划");

    await expect(page.locator("text=双轨制学习计划")).toBeVisible();
    // 验证滑块存在
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test("创建双轨制计划", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=双轨制计划");

    // 填写计划名称
    await page.fill('input[placeholder=\'如："初一数学拔高计划"\']', "初一数学拔高计划");

    // 调整滑块 - 校内同步60%
    const slider = page.locator('input[type="range"]').first();
    await slider.fill("60");

    // 总课时
    await page.fill('input[placeholder="如：48"]', "48");
    // 总价
    await page.fill('input[placeholder="如：12800"]', "12800");

    // 填写说明
    await page.fill("textarea", "针对校内同步和竞赛拓展的均衡发展方案");

    await page.click('button:has-text("创建计划")');

    await expect(page.locator("text=双轨制学习计划创建成功")).toBeVisible({
      timeout: 5000,
    });

    // 验证跳转回学生详情
    await expect(page.locator("text=双轨制学习计划").first()).toBeVisible();
    await expect(page.locator("text=校内同步")).toBeVisible();
    await expect(page.locator("text=竞赛拓展")).toBeVisible();
  });
});
