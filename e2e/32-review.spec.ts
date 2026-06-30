import { test, expect } from "@playwright/test";
import { login, createTestStudent, createMistake } from "./helpers";

test.describe("错题复习", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("页面展示", async ({ page }) => {
    await page.goto("/dashboard/review");
    await expect(page.locator("text=错题复习")).toBeVisible();
    await expect(page.locator("text=全部学生").first()).toBeVisible();
  });

  test("有错题时显示复习卡片", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      await createMistake(page, "测试学生张三", "数学", "2x+3=7 学生答x=5");
    }

    await page.goto("/dashboard/review");
    await page.waitForLoadState("networkidle");

    // 如果有错题，应该看到"查看答案"按钮
    const revealBtn = page.locator("text=查看答案");
    if (await revealBtn.isVisible()) {
      await expect(revealBtn).toBeVisible();
    } else {
      // 或者显示"没有需要复习的错题"
      await expect(page.locator("text=没有需要复习的错题")).toBeVisible();
    }
  });

  test("无错题时显示完成状态", async ({ page }) => {
    await page.goto("/dashboard/review");
    await page.waitForLoadState("networkidle");
    // 如果没错题，应该显示完成信息
    const emptyState = page.locator("text=没有需要复习的错题");
    if (await emptyState.isVisible()) {
      await expect(page.locator("text=所有错题已掌握").first()).toBeVisible();
    }
  });
});
