import { test, expect } from "@playwright/test";
import { login, createTestStudent, createMistake } from "./helpers";

test.describe("错题本打印版", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("打印错题本链接可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      await createMistake(page, "测试学生张三", "数学", "测试错题内容");
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=错题本");
    await expect(page.locator("text=打印错题本")).toBeVisible();
  });

  test("错题本打印页面展示", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      await createMistake(page, "测试学生张三", "数学", "2x+3=7 学生答x=5");
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=错题本");

    // 在新标签页中打开打印版
    const printLink = page.locator('a:has-text("打印错题本")');
    const href = await printLink.getAttribute("href");
    expect(href).toContain("/mistakes-print");

    // 直接导航到打印页面
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    // 验证打印页面内容
    await expect(page.locator("text=错题本").first()).toBeVisible();
    await expect(page.locator("text=打印/导出PDF")).toBeVisible();
  });
});
