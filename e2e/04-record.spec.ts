import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("每日学情", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("学情记录页面展示", async ({ page }) => {
    await page.goto("/dashboard/records");
    await expect(page.locator("text=每日学情")).toBeVisible();
    await expect(page.locator("button:has-text('记录学情')")).toBeVisible();
  });

  test("新建学情记录", async ({ page }) => {
    // 确保有学生
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/records");
    await page.click("text=记录学情");
    await page.waitForSelector('h3:has-text("记录学情")', { timeout: 3000 });

    // 选择学生
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });

    // 填写学情记录
    const notes = "今天学习一元一次方程，概念理解不错，应用题列方程还需加强";
    await page.fill("textarea", notes);

    // 选择掌握度（较好）
    await page.selectOption("select:below(:text('掌握度'))", "4");
    // 学习状态
    await page.selectOption("select:below(:text('学习状态'))", "good");
    // 作业完成
    await page.selectOption("select:below(:text('作业完成'))", "true");

    // 下节课重点
    await page.fill(
      'input[placeholder="下节课需要重点攻克什么？"]',
      "应用题列方程专项训练"
    );

    await page.click('button:has-text("保存记录")');
    await expect(page.locator("text=学情记录已保存")).toBeVisible({
      timeout: 5000,
    });

    // 验证记录出现在列表中
    await expect(page.locator("text=测试学生张三")).toBeVisible();
    await expect(page.locator(`text=${notes.slice(0, 20)}`)).toBeVisible();
  });

  test("快捷模板填充学情", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/records");
    await page.click("text=记录学情");
    await page.waitForSelector('h3:has-text("记录学情")', { timeout: 3000 });

    // 选择学生
    await page.selectOption("select:below(:text('学生'))", {
      label: "测试学生张三",
    });

    // 点击"新课顺利"模板
    await page.click('button:has-text("📗 新课顺利")');
    await page.waitForTimeout(300);

    // 验证模板已填充
    const textarea = page.locator("textarea");
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(10);

    // 保存
    await page.click('button:has-text("保存记录")');
    await expect(page.locator("text=学情记录已保存")).toBeVisible({
      timeout: 5000,
    });
  });

  test("学情筛选功能", async ({ page }) => {
    await page.goto("/dashboard/records");
    const select = page.locator("select");
    // 选择学生筛选
    const option = select.locator("option", { hasText: "测试学生张三" });
    if (await option.count() > 0) {
      await select.selectOption({ label: "测试学生张三" });
      await page.waitForTimeout(500);
      // 验证筛选生效
      await expect(page.locator("text=测试学生张三").first()).toBeVisible();
    }
  });
});
