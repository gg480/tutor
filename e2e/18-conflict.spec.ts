import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("排课冲突检测", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("同一时间排课显示冲突提示", async ({ page }) => {
    // 创建学生A和B
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    // 创建第一节课
    await page.goto("/dashboard/courses");
    await page.click("text=新建课程");
    await page.waitForSelector('h3:has-text("新建课程")', { timeout: 3000 });
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });
    await page.fill('input[placeholder="如：数学"]', "数学");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const isoStr = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', isoStr);
    await page.click('button:has-text("创建")');

    // 检查是否冲突成功或失败
    const success = await page.locator("text=课程已创建").isVisible({ timeout: 3000 }).catch(() => false);
    const conflict = await page.locator("text=排课冲突").isVisible({ timeout: 3000 }).catch(() => false);

    if (success) {
      console.log("✅ 第一节课创建成功，再创建第二节课检测冲突");

      // 再排同一时间课
      await page.click("text=新建课程");
      await page.waitForSelector('h3:has-text("新建课程")', { timeout: 3000 });
      await page.selectOption("select:below(:text('学生'))", {
        label: "测试学生张三",
      });
      await page.fill('input[placeholder="如：数学"]', "物理");
      await page.fill('input[type="datetime-local"]', isoStr);
      await page.click('button:has-text("创建")');

      await expect(page.locator("text=排课冲突")).toBeVisible({ timeout: 3000 });
      console.log("✅ 排课冲突检测生效");
    } else if (conflict) {
      console.log("✅ 排课冲突检测直接生效");
    }
  });
});
