import { Page, Locator } from "@playwright/test";

/**
 * 在 select 中按学生姓名部分匹配并选中 option。
 * Playwright 的 `selectOption({ label })` 在类型上只接受 string，但运行时支持正则。
 * 此处改用 Locator 按文本过滤后取 ElementHandle，避免类型错误。
 */
async function selectStudentOption(
  selectLocator: Locator,
  studentName: string
) {
  const option = selectLocator.locator("option").filter({ hasText: studentName }).first();
  const handle = await option.elementHandle();
  if (!handle) {
    throw new Error(`未找到匹配学生「${studentName}」的 <option>`);
  }
  await selectLocator.selectOption(handle);
}

/** 用管理员账号登录 */
export async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@shibu.com");
  await page.fill('input[type="password"]', "shibu123456");
  await page.click('button[type="submit"]');
  // 等待跳转到工作台
  await page.waitForURL("/dashboard", { timeout: 10000 });
  // 确认已登录 — 工作台标题可见
  await page.waitForSelector("text=欢迎回来", { timeout: 5000 });
}

/** 创建测试学生数据 */
export async function createTestStudent(page: Page) {
  await page.goto("/dashboard/students/new");
  await page.waitForSelector('h1:has-text("新建学生档案")', { timeout: 5000 });

  // 基本信息
  await page.fill('input[name="name"]', "测试学生张三");
  await page.selectOption('select[name="grade"]', "初一");
  await page.fill('input[name="school"]', "实验中学");
  await page.fill('input[name="textbook"]', "人教版");
  await page.fill('input[name="currentScore"]', "班级第15名");

  // 家长信息
  await page.fill('input[name="parentName"]', "张妈妈");
  await page.fill('input[name="parentPhone"]', "13800138000");
  await page.fill('input[name="parentWechat"]', "zhangmom");

  // 主观认知
  await page.fill('textarea[name="parentGoal"]', "希望数学成绩进入班级前10");
  await page.fill('textarea[name="studentGoal"]', "想考实验中学高中部");

  // 教师诊断
  await page.fill('textarea[name="personality"]', "性格开朗，但容易粗心");
  await page.fill(
    'textarea[name="weakness"]',
    "一元一次方程应用题薄弱"
  );
  await page.fill('textarea[name="summary"]', "基础尚可，需要加强应用题训练");

  // 提交
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=学生建档成功", { timeout: 5000 });
}

/** 创建课程 */
export async function createCourse(
  page: Page,
  studentName: string,
  subject: string
) {
  await page.goto("/dashboard/courses");
  await page.click("text=新建课程");
  await page.waitForSelector('h3:has-text("新建课程")', { timeout: 3000 });

  // 选择学生
  await selectStudentOption(page.locator("select:below(:text('学生'))"), studentName);
  // 填写科目
  await page.fill('input[placeholder="如：数学"]', subject);
  // 选择时间（明天下午3点，避免冲突）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);
  const isoStr = tomorrow.toISOString().slice(0, 16);
  await page.fill('input[type="datetime-local"]', isoStr);

  await page.click('button:has-text("创建")');
  await page.waitForSelector("text=课程已创建", { timeout: 5000 });
}

/** 记录学情 */
export async function createDailyRecord(
  page: Page,
  studentName: string,
  notes: string
) {
  await page.goto("/dashboard/records");
  await page.click("text=记录学情");
  await page.waitForSelector('h3:has-text("记录学情")', { timeout: 3000 });

  await selectStudentOption(page.locator("select:below(:text('学生'))"), studentName);
  await page.fill("textarea", notes);
  await page.selectOption("select:below(:text('掌握度'))", "4");
  await page.selectOption("select:below(:text('学习状态'))", "good");

  await page.click('button:has-text("保存记录")');
  await page.waitForSelector("text=学情记录已保存", { timeout: 5000 });
}

/** 录入错题 */
export async function createMistake(
  page: Page,
  studentName: string,
  subject: string,
  content: string
) {
  await page.goto("/dashboard/mistakes");
  await page.click("text=录入错题");
  await page.waitForSelector('h3:has-text("录入错题")', { timeout: 3000 });

  await selectStudentOption(page.locator("select:below(:text('学生'))"), studentName);
  await page.fill('input[placeholder="如：数学"]', subject);
  // 选错因
  await page.click('button:has-text("概念不清")');
  // 填内容
  await page.fill("textarea", content);

  await page.click('button:has-text("保存错题")');
  await page.waitForSelector("text=错题已记录", { timeout: 5000 });
}

/** 录入成绩 */
export async function createScore(
  page: Page,
  studentName: string,
  examName: string,
  score: number
) {
  await page.goto("/dashboard/scores");
  await page.click("text=录入成绩");
  await page.waitForSelector('h3:has-text("录入成绩")', { timeout: 3000 });

  await selectStudentOption(page.locator("select:below(:text('学生'))"), studentName);
  await page.fill('input[placeholder="期中/月考/竞赛"]', examName);
  await page.fill('input[placeholder="数学"]', "数学");
  await page.fill('input[type="number"]:below(:text("得分"))', String(score));
  await page.selectOption("select:below(:text('考试类型'))", "school");

  await page.click('button:has-text("保存成绩")');
  await page.waitForSelector("text=成绩已记录", { timeout: 5000 });
}
