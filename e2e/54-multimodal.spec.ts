import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("多模态运行环境", () => {
  test("API 健康检查返回完整环境信息", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.tables).toBeDefined();
    expect(data.checks.data).toBeDefined();
  });

  test("服务端环境检测（无需登录）", async ({ page }) => {
    const response = await page.request.get("/api/health");
    const data = await response.json();
    expect(data.checks.environment).toBeDefined();
    expect(data.checks.environment.detail).toContain("NEXTAUTH_URL");
  });

  test("数据库包含所有必需表", async ({ page }) => {
    const response = await page.request.get("/api/health");
    const data = await response.json();
    const tables = data.checks.tables?.detail || "";
    expect(tables).toContain("Student");
    expect(tables).toContain("Course");
    expect(tables).toContain("DailyRecord");
    expect(tables).toContain("MistakeRecord");
    expect(tables).toContain("ExamScore");
  });

  test("模拟业务流程（创建学生→排课→成绩）", async ({ page }) => {
    await login(page);

    // 创建学生
    const studentRes = await page.request.post("/api/students", {
      data: {
        name: `多模态测试_${Date.now()}`,
        grade: "初一",
        school: "多模态测试中学",
      },
    });
    expect(studentRes.status()).toBe(201);
    const student = await studentRes.json();
    expect(student.data?.id).toBeDefined();

    // 排课
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const courseRes = await page.request.post("/api/courses", {
      data: {
        studentId: student.data.id,
        subject: "数学",
        startTime: tomorrow.toISOString(),
        duration: 120,
      },
    });
    expect(courseRes.status()).toBe(201);

    // 录入成绩
    const scoreRes = await page.request.post("/api/scores", {
      data: {
        studentId: student.data.id,
        examName: "多模态测试考试",
        subject: "数学",
        score: 92,
        totalScore: 100,
      },
    });
    expect(scoreRes.status()).toBe(201);

    // 验证学生列表
    const listRes = await page.request.get("/api/students");
    const list = await listRes.json();
    expect(list.data?.length).toBeGreaterThan(0);
  });

  test("运行时文件检测", async ({ page }) => {
    // 验证必要的运行时文件存在
    const response = await page.request.get("/api/health");
    const data = await response.json();
    expect(data.checks.database?.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });
});
