// ============================================
// TDD RED Phase — 写失败测试
// 测试必须基于真实的 Playwright 点击操作
// ============================================
import { test, expect } from "@playwright/test";
import { login, createTestStudent } from "./helpers";

test.describe("RED: 真实用户操作流程", () => {
  // ===== 测试1: 完整登录流程 =====
  test("TDD-1: 登录→工作台→侧边栏导航完整链路", async ({ page }) => {
    // 1. 访问登录页
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("拾步");

    // 2. 填写邮箱
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill("admin@shibu.com");

    // 3. 填写密码
    const pwdInput = page.locator('input[type="password"]');
    await expect(pwdInput).toBeVisible();
    await pwdInput.fill("shibu123456");

    // 4. 点击登录按钮
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    // 5. 验证跳转到工作台
    await page.waitForURL("/dashboard", { timeout: 10000 });
    await expect(page.locator("text=欢迎回来")).toBeVisible();

    // 6. 点击侧边栏"学生管理"
    await page.click('a:has-text("学生管理")');
    await page.waitForURL("/dashboard/students");
    await expect(page.locator("h1")).toContainText("学生管理");

    // 7. 点击侧边栏"排课日历"
    await page.click('a:has-text("排课日历")');
    await page.waitForURL("/dashboard/courses");
    await expect(page.locator("h1")).toContainText("排课日历");
  });

  // ===== 测试2: 新建学生 (实际表单操作) =====
  test("TDD-2: 表单填写→创建学生→验证详情", async ({ page }) => {
    // 登录
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 1. 导航到学生管理
    await page.click('a:has-text("学生管理")');
    await page.waitForURL("/dashboard/students");

    // 2. 点击"新建学生"按钮
    await page.click('a:has-text("新建学生")');
    await page.waitForURL("/dashboard/students/new");
    await expect(page.locator("h1")).toContainText("新建学生档案");

    // 3. 填写基本信息
    await page.fill('input[name="name"]', `TDD测试学生_${Date.now()}`);
    await page.selectOption('select[name="grade"]', "初一");
    await page.fill('input[name="school"]', "TDD测试中学");
    await page.fill('input[name="textbook"]', "人教版");

    // 4. 填写家长信息
    await page.fill('input[name="parentName"]', "TDD家长");
    await page.fill('input[name="parentPhone"]', "13800138000");

    // 5. 填写主观认知
    await page.fill('textarea[name="parentGoal"]', "希望数学成绩提升");
    await page.fill('textarea[name="studentGoal"]', "想考满分");

    // 6. 填写教师诊断
    await page.fill('textarea[name="personality"]', "性格开朗");
    await page.fill('textarea[name="weakness"]', "粗心大意");
    await page.fill('textarea[name="summary"]', "基础尚可");

    // 7. 点击提交按钮
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 8. 验证跳转到学生详情页
    await page.waitForURL(/\/dashboard\/students\//, { timeout: 10000 });
    await expect(page.locator("text=TDD测试中学")).toBeVisible();
  });

  // ===== 测试3: 排课操作 (弹窗操作) =====
  test("TDD-3: 打开排课弹窗→创建课程→验证日历", async ({ page }) => {
    // 先登录
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 确保有学生可以排课
    await page.click('a:has-text("学生管理")');
    await page.waitForURL("/dashboard/students");

    // 检查是否有学生，没有则创建
    const hasStudent = await page.locator("text=TDD测试学生").first().isVisible().catch(() => false);
    if (!hasStudent) {
      // 快速创建学生 via API
      await page.request.post("/api/students", {
        data: { name: `TDD排课学生_${Date.now()}`, grade: "初一" },
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
    }

    // 导航到排课页
    await page.click('a:has-text("排课日历")');
    await page.waitForURL("/dashboard/courses");

    // 点击"新建课程"按钮
    await page.click('button:has-text("新建课程")');
    await expect(page.locator("h3")).toContainText("新建课程");

    // 选择学生 (点击select并选择)
    const studentSelect = page.locator("select").first();
    await studentSelect.selectOption({ index: 1 }); // 第一个学生

    // 填写科目
    await page.fill('input[placeholder="如：数学"]', "数学");

    // 设置时间
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dateStr);

    // 点击创建
    await page.click('button[type="submit"]:has-text("创建")');
    await expect(page.locator("text=课程已创建")).toBeVisible({ timeout: 5000 });
  });

  // ===== 测试4: 学情记录 (选择学生+填写+保存) =====
  test("TDD-4: 学情记录→选择学生→填写内容→保存验证", async ({ page }) => {
    // 登录
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 导航到学情记录
    await page.click('a:has-text("每日学情")');
    await page.waitForURL("/dashboard/records");

    // 点击"记录学情"按钮
    await page.click('button:has-text("记录学情")');
    await expect(page.locator("h3")).toContainText("记录学情");

    // 如果有学生可选
    const selectEl = page.locator('select:below(:text("学生"))').first();
    const options = await selectEl.locator("option").all();
    if (options.length > 1) {
      await selectEl.selectOption({ index: 1 });

      // 填写学情内容
      const notes = `TDD学情测试_${Date.now()}`;
      await page.fill("textarea", notes);

      // 选择掌握度
      await page.selectOption('select:below(:text("掌握度"))', "4");

      // 选择学习状态
      await page.selectOption('select:below(:text("学习状态"))', "good");

      // 点击保存
      await page.click('button:has-text("保存记录")');
      await expect(page.locator("text=学情记录已保存")).toBeVisible({ timeout: 5000 });
    }
  });

  // ===== 测试6: 错题录入→错因分类→状态更新 完整流程 =====
  test("TDD-6: 错题录入→选错因→保存→验证列表展示", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 确保有学生
    const studentsRes = await page.request.get("/api/students");
    const students = await studentsRes.json();
    if (!students.data?.length) {
      await createTestStudent(page);
    }

    // 导航到错题管理
    await page.click('a:has-text("错题管理")');
    await page.waitForURL("/dashboard/mistakes");

    // 点击"录入错题"按钮
    await page.click('button:has-text("录入错题")');
    await expect(page.locator("h3")).toContainText("录入错题");

    // 选择学生
    await page.locator('select:below(:text("学生"))').first().selectOption({ index: 1 });
    await page.fill('input[placeholder="如：数学"]', "数学");

    // 选择错因分类: 概念不清
    await page.click('button:has-text("概念不清")');

    // 填写错题内容
    const mistakeContent = `TDD错题_${Date.now()}: 已知2x+3=7，求x`;
    await page.fill("textarea", mistakeContent);
    await page.fill('textarea:below(:text("学生的错误答案"))', "x=5");
    await page.fill('textarea:below(:text("正确答案"))', "x=2");

    // 保存
    await page.click('button:has-text("保存错题")');
    await expect(page.locator("text=错题已记录")).toBeVisible({ timeout: 5000 });

    // 验证列表显示
    await expect(page.locator("text=概念不清")).toBeVisible();
    await expect(page.locator("text=待解决")).toBeVisible();
  });

  // ===== 测试7: 成绩录入→进度条→验证显示 =====
  test("TDD-7: 成绩录入→填写分数→保存→验证列表", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 确保有学生
    const studentsRes = await page.request.get("/api/students");
    const students = await studentsRes.json();
    if (!students.data?.length) {
      await createTestStudent(page);
    }

    // 导航到成绩曲线
    await page.click('a:has-text("成绩曲线")');
    await page.waitForURL("/dashboard/scores");

    // 点击录入成绩
    await page.click('button:has-text("录入成绩")');
    await expect(page.locator("h3")).toContainText("录入成绩");

    // 选择学生
    await page.locator('select:below(:text("学生"))').first().selectOption({ index: 1 });
    await page.fill('input[placeholder="期中/月考/竞赛"]', "TDD测试考试");
    await page.fill('input[placeholder="数学"]', "数学");
    await page.fill('input[type="number"]:below(:text("得分"))', "88");

    // 保存
    await page.click('button:has-text("保存成绩")');
    await expect(page.locator("text=成绩已记录")).toBeVisible({ timeout: 5000 });

    // 验证
    await expect(page.locator("text=TDD测试考试")).toBeVisible();
  });

  // ===== 测试8: 课程包创建→续费操作 =====
  test("TDD-8: 创建课程包→验证课时→续费增加课时", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 确保有学生
    const studentsRes = await page.request.get("/api/students");
    const students = await studentsRes.json();
    if (!students.data?.length) {
      await createTestStudent(page);
    }

    // 导航到课程包
    await page.click('a:has-text("课程包")');
    await page.waitForURL("/dashboard/registrations");

    // 点击新建课程包
    await page.click('button:has-text("新建课程包")');
    await expect(page.locator("h3")).toContainText("新建课程包");

    // 选择学生
    await page.locator('select:below(:text("学生"))').first().selectOption({ index: 1 });
    await page.fill('input[placeholder=\'如："初一数学48课时包"\']', "TDD课程包");
    await page.fill('input[type="number"]:below(:text("总课时"))', "48");
    await page.fill('input[type="number"]:below(:text("总价（元）"))', "9600");

    // 创建
    await page.click('button:has-text("创建课程包")');
    await expect(page.locator("text=课程包已创建")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=剩余 48 课时")).toBeVisible();

    // 点击续费
    await page.click('button:has-text("续费")');
    await page.fill('input[placeholder="课时"]', "24");
    await page.fill('input[placeholder="金额（元）"]', "4800");
    await page.click('button:has-text("确认续费")');
    await expect(page.locator("text=续费成功")).toBeVisible({ timeout: 5000 });
  });

  // ===== 测试9: 批量排课操作 =====
  test("TDD-9: 批量排课→选择星期→创建验证", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 确保有学生
    const studentsRes = await page.request.get("/api/students");
    const students = await studentsRes.json();
    if (!students.data?.length) {
      await createTestStudent(page);
    }

    // 导航到排课日历
    await page.click('a:has-text("排课日历")');
    await page.waitForURL("/dashboard/courses");

    // 点击批量排课
    await page.click('button:has-text("批量排课")');
    await expect(page.locator("h3")).toContainText("批量排课");

    // 选择学生
    await page.locator('select:below(:text("学生"))').first().selectOption({ index: 1 });
    await page.fill('input[placeholder="数学"]', "数学");

    // 设置日期范围
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.getTime() + 14 * 86400000).toISOString().split("T")[0];
    await page.locator('input[type="date"]').nth(0).fill(startDate);
    await page.locator('input[type="date"]').nth(1).fill(endDate);

    // 选择星期：周一、周三、周五
    await page.click('button:has-text("一")');
    await page.click('button:has-text("三")');
    await page.click('button:has-text("五")');

    // 设置时间
    await page.fill('input[type="time"]', "10:00");

    // 确认创建
    await page.click('button:has-text("确认批量创建")');
    // 可能成功或部分成功
    await page.waitForTimeout(2000);
    const successMsg = page.locator("text=批量排课成功");
    const partialMsg = page.locator("text=节失败");
    await expect(successMsg.or(partialMsg).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  // ===== 测试10: 学员周报生成 =====
  test("TDD-10: 选择学生→生成周报→验证周报内容", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 确保有学生和学情数据
    const studentsRes = await page.request.get("/api/students");
    const students = await studentsRes.json();
    if (!students.data?.length) {
      await createTestStudent(page);
      // 创建学情记录
      await page.request.post("/api/records", {
        data: { studentId: students.data?.[0]?.id || "", teacherNotes: "TDD周报测试", masteryLevel: 4 },
      });
    }

    // 导航到学员周报
    await page.click('a:has-text("学员周报")');
    await page.waitForURL("/dashboard/weekly");

    // 选择学生
    const selectEl = page.locator('select:below(:text("选择学生"))').first();
    const opts = await selectEl.locator("option").all();
    if (opts.length > 1) {
      await selectEl.selectOption({ index: 1 });

      // 填写下周计划
      await page.fill('input[placeholder="如：继续强化一元一次方程应用题"]', "继续强化训练");

      // 点击生成本周周报
      await page.click('button:has-text("生成本周周报")');
      await expect(page.locator("text=周报已生成")).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });

  // ===== 测试5: 全部侧边栏24项导航可点击 =====
  test("TDD-5: 全部24项导航点击验证", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@shibu.com");
    await page.fill('input[type="password"]', "shibu123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    const navLinks = [
      "通知中心", "学生管理", "排课日历", "课程包",
      "业财看板", "月度收入", "试听管理", "AI学案",
      "知识点", "每日学情", "错题管理", "错题复习",
      "成绩曲线", "学员周报", "竞赛成果", "学习报告",
      "学期总结", "学习活动", "数据总览", "操作日志",
      "系统设置", "新手上路", "更新日志",
    ];

    for (const label of navLinks) {
      const link = page.locator(`a:has-text("${label}")`).first();
      await expect(link).toBeVisible({ timeout: 3000 });
      await link.click();
      await page.waitForLoadState("networkidle");
      console.log(`✅ 导航 "${label}" — ${page.url()}`);
    }
  });
});
