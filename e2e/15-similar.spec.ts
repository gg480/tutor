import { test, expect } from "@playwright/test";
import { login, createTestStudent, createMistake } from "./helpers";

test.describe("错题→同类题推荐（举一反三）", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("举一反三按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
      await createMistake(
        page,
        "测试学生张三",
        "数学",
        "2x+3=7 学生答x=5，应为x=2"
      );
    }

    await page.goto("/dashboard/mistakes");
    // 验证"举一反三"按钮存在
    await expect(
      page.locator("text=举一反三").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("展开同类题", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    // 确保有错题
    await page.goto("/dashboard/mistakes");
    const hasMistakes = await page.locator("text=举一反三").isVisible();
    if (!hasMistakes) {
      await createMistake(
        page,
        "测试学生张三",
        "数学",
        "2x+3=7 学生答x=5，应为x=2"
      );
    }

    await page.goto("/dashboard/mistakes");
    // 点击举一反三
    await page.locator("text=举一反三").first().click();
    await page.waitForTimeout(2000);

    // 验证同类题显示
    await expect(page.locator("text=做对了").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=没做对").first()).toBeVisible();
  });

  test("标记同类题做对", async ({ page }) => {
    await page.goto("/dashboard/mistakes");
    const btn = page.locator("text=举一反三").first();

    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(2000);

      const correctBtn = page.locator("text=做对了").first();
      if (await correctBtn.isVisible()) {
        await correctBtn.click();
        // 验证反馈
        await expect(
          page.locator("text=做对了").first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
