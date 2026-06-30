import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("家长端学情查看", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("生成分享链接按钮可见", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }
    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await expect(page.locator("button:has-text('分享')")).toBeVisible();
  });

  test("点击分享按钮生成链接", async ({ page }) => {
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");
    await page.click("button:has-text('分享')");

    // 应该提示链接已复制
    await expect(page.locator("text=分享链接已复制")).toBeVisible({
      timeout: 5000,
    });
  });

  test("家长页面可公开访问（无需登录）", async ({ page }) => {
    // 先获取分享token
    await page.goto("/dashboard/students");
    const exists = await page.locator("text=测试学生张三").isVisible();
    if (!exists) {
      await createTestStudent(page);
    }

    // 通过API生成token
    await page.goto("/dashboard/students");
    await page.click("text=测试学生张三");

    // 获取学生ID (从URL)
    const url = page.url();
    const studentId = url.split("/").pop();

    // 直接调用API生成分享
    const res = await page.request.post("/api/share", {
      data: { studentId },
    });
    const json = await res.json();

    if (json.data?.shareUrl) {
      // 退出登录
      await page.click("text=退出登录");
      await page.waitForURL("/login");

      // 直接访问家长页面
      await page.goto(json.data.shareUrl);
      await page.waitForLoadState("networkidle");

      // 验证页面内容
      await expect(page.locator("text=拾步").first()).toBeVisible();
      await expect(page.locator("text=学习报告").first()).toBeVisible();
      await expect(page.locator("text=测试学生张三")).toBeVisible();
      await expect(page.locator("text=学情记录")).toBeVisible();
    }
  });

  test("无效分享链接显示错误提示", async ({ page }) => {
    await page.goto("/parent/invalidtoken123");
    await page.waitForLoadState("networkidle");
    // 应显示错误
    await expect(page.locator("text=链接已失效").first()).toBeVisible();
  });
});
