import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("学生管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("新建学生档案 — 完整流程", async ({ page }) => {
    await createTestStudent(page);

    // 验证跳转到学生详情页
    await expect(page.url()).toContain("/dashboard/students/");
    await expect(page.locator("text=测试学生张三")).toBeVisible();
    // 验证学情总览Tab内容
    await expect(page.locator("text=实验中学")).toBeVisible();
    await expect(page.locator("text=希望数学成绩进入班级前10")).toBeVisible();
    await expect(page.locator("text=性格开朗，但容易粗心")).toBeVisible();
  });

  test("学生列表展示", async ({ page }) => {
    await page.goto("/dashboard/students");
    await expect(page.locator("text=学生管理")).toBeVisible();

    // 验证列表中存在刚创建的学生
    await expect(page.locator("text=测试学生张三")).toBeVisible();
    // 验证在读标签
    await expect(page.locator("text=在读").first()).toBeVisible();
  });

  test("搜索学生功能", async ({ page }) => {
    await page.goto("/dashboard/students");
    const searchInput = page.locator('input[placeholder="搜索学生姓名、学校..."]');
    await searchInput.fill("测试学生张三");
    await searchInput.press("Enter");

    // 验证搜索结果
    await expect(page.locator("text=测试学生张三")).toBeVisible();
  });

  test("学生详情 — 查看学情记录Tab", async ({ page }) => {
    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");

    // 验证详情页5个Tab
    await expect(page.locator("text=学情总览")).toBeVisible();
    await expect(page.locator("text=学情记录")).toBeVisible();
    await expect(page.locator("text=错题本")).toBeVisible();
    await expect(page.locator("text=成绩曲线")).toBeVisible();
    await expect(page.locator("text=成长时间线")).toBeVisible();

    // 验证统计卡片
    await expect(page.locator("text=建档时间")).toBeVisible();
    await expect(page.locator("text=待处理错题")).toBeVisible();
    await expect(page.locator("text=学情记录")).toBeVisible();
  });
});
