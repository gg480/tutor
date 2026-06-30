import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("诊断报告", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("诊断报告页面展示", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=诊断报告");

    await expect(page.locator("text=学情诊断报告")).toBeVisible();
    await expect(page.locator('button:has-text("打印/导出PDF")')).toBeVisible();
  });

  test("生成诊断报告", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("text=诊断报告");

    // 填写诊断结论
    await page.fill(
      "textarea:below(:text('诊断结论'))",
      "核心问题：函数思维尚未建立，对变量间的关系理解停留在机械记忆层面。具体表现：能完成单一公式计算，但遇到多步推理的应用题时思路混乱。"
    );

    // 填写改进建议
    await page.fill(
      "textarea:below(:text('改进建议'))",
      "短期：每天2道应用题列方程训练，重点突破等量关系识别。中期：建立错题本，每周复盘一次。长期：逐步建立函数思维。"
    );

    // 点击生成
    await page.click('button:has-text("生成报告")');

    // 验证报告生成成功
    await expect(page.locator("text=诊断报告已生成")).toBeVisible({
      timeout: 5000,
    });

    // 验证报告内容展示
    await expect(page.locator("text=一、主观认知")).toBeVisible();
    await expect(page.locator("text=六、改进建议")).toBeVisible();
  });
});
