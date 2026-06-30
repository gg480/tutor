# 拾步 · OPC Tutor Suite

> 个人家教工作室全周期教学管理系统  
> 56轮迭代 · 46个API · 36个页面 · 54个测试

[![CI/CD](https://github.com/gg480/tutor/actions/workflows/ci.yml/badge.svg)](https://github.com/gg480/tutor/actions/workflows/ci.yml)

---

## 🚀 快速开始

### 本地运行
```bash
bash setup.sh dev
# 或: ./scripts/shibu-cli.sh dev
```

### Docker
```bash
# 构建并启动
docker compose build
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down

# CLI
./scripts/shibu-cli.sh docker
```

### Windows CLI
```cmd
scripts\shibu-cli.bat dev
scripts\shibu-cli.bat docker
scripts\shibu-cli.bat test
```

**默认管理员账号：** `admin@shibu.com` / `shibu123456`

---

## 🏗️ 项目架构

```
shibu/
├── src/
│   ├── app/
│   │   ├── api/          # 43个 REST API 路由
│   │   ├── dashboard/    # 29个工作台页面
│   │   ├── parent/       # 1个家长端H5页面
│   │   ├── studio/       # 1个工作室品牌页
│   │   ├── login/        # 登录页
│   │   └── not-found.tsx # 404页面
│   ├── components/       # 16个可复用组件
│   └── lib/              # 6个工具库
├── prisma/
│   └── schema.prisma     # 16张数据表
├── e2e/                  # 49个 Playwright 测试
└── playwright.config.ts
```

### 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 14 (App Router) |
| 数据库 | SQLite (开发) / PostgreSQL (生产) |
| ORM | Prisma |
| 认证 | NextAuth.js (Credentials) |
| UI | Tailwind CSS + Lucide Icons |
| 测试 | Playwright (E2E) |
| 部署 | Vercel / Railway |

---

## 🧭 23项导航

```
 ① 工作台      ② 通知中心      ③ 学生管理      ④ 排课日历
 ⑤ 课程包      ⑥ 业财看板      ⑦ 月度收入      ⑧ 试听管理
 ⑨ AI学案      ⑩ 每日学情      ⑪ 错题管理      ⑫ 错题复习
 ⑬ 成绩曲线    ⑭ 学员周报      ⑮ 竞赛成果      ⑯ 学习报告
 ⑰ 学期总结    ⑱ 学习活动      ⑲ 数据总览      ⑳ 操作日志
 ㉑ 系统设置    ㉒ 新手上路      ㉓ 更新日志
```

---

## 🎯 OPC 四阶段功能覆盖

| 阶段 | 功能 | 状态 |
|------|------|------|
| **分析期** | 学生建档（含诊断字段） | ✅ |
| **分析期** | 学生编辑/删除 | ✅ |
| **分析期** | 学情诊断报告（打印） | ✅ |
| **准备期** | 知识点图谱（20+节点） | ✅ |
| **准备期** | 双轨制学习计划（校内+竞赛） | ✅ |
| **准备期** | AI学案生成 | ✅ |
| **执行期** | 排课/签到/自动扣课 | ✅ |
| **执行期** | 批量排课/日历导出(iCal) | ✅ |
| **执行期** | 排课冲突检测 | ✅ |
| **执行期** | 每日学情记录（快捷模板） | ✅ |
| **执行期** | 批量学情记录 | ✅ |
| **执行期** | 错题管理（4类错因分类） | ✅ |
| **执行期** | 错题→同类题推荐（举一反三） | ✅ |
| **执行期** | 错题复习模式（Flashcard） | ✅ |
| **执行期** | 错题本打印 | ✅ |
| **执行期** | 成绩录入+SVG趋势图表 | ✅ |
| **执行期** | 课程包管理+续费 | ✅ |
| **结课期** | 学员周报（自动生成） | ✅ |
| **结课期** | 全周期学习报告 | ✅ |
| **结课期** | 学期总结报告（PDF） | ✅ |

## ✨ 差异化功能（竞品空白）

| 功能 | 说明 |
|------|------|
| 🎯 **双轨制学习计划** | 校内同步+竞赛拓展比例可调 |
| 🤖 **AI学案生成** | 基于知识点一键生成结构化教案 |
| 🔄 **错题→同类题推荐** | 按错因推荐变式题，满3次自动标记掌握 |
| 📋 **学员周报** | 自动统计本周课时/掌握度/错题趋势 |
| 📱 **家长端H5** | 无需登录，分享链接查看学情 |
| 📊 **业财看板** | 预收款管理+收入确认+续费预警 |
| 📈 **成绩SVG趋势图** | 纯SVG实现，无外部依赖 |
| 🧠 **错题复习模式** | 抽认卡式逐题回顾 |
| 📅 **iCal日历导出** | 可导入Apple/Google/Outlook |

---

## 🔌 API 路由一览（43个）

### 认证
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | * | NextAuth 认证 |

### 核心业务
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/students` | GET/POST | 学生列表/创建 |
| `/api/students/[id]` | GET/PUT/DELETE | 学生详情/更新/删除 |
| `/api/students/[id]/timeline` | GET | 学生成长时间线 |
| `/api/courses` | GET/POST | 课程列表/创建 |
| `/api/courses/[id]` | PUT/DELETE | 课程更新/删除 |
| `/api/courses/batch` | POST | 批量排课 |
| `/api/records` | GET/POST | 学情列表/创建 |
| `/api/records/[id]` | PUT/DELETE | 学情更新/删除 |
| `/api/records/batch` | POST | 批量学情 |
| `/api/mistakes` | GET/POST | 错题列表/创建 |
| `/api/mistakes/[id]` | PUT/DELETE | 错题更新/删除 |
| `/api/mistakes/[id]/similar` | GET/POST | 同类题推荐/练习 |
| `/api/scores` | GET/POST | 成绩列表/创建 |
| `/api/registrations` | GET/POST | 课程包列表/创建 |
| `/api/registrations/[id]` | PUT | 课程包续费 |

### 客户管理
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/trials` | GET/POST | 试听线索 |
| `/api/trials/[id]` | PUT/DELETE | 线索更新/删除 |
| `/api/achievements` | GET/POST | 竞赛成果 |

### 报表与分析
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/dashboard` | GET | 工作台聚合数据 |
| `/api/finance` | GET | 财务数据 |
| `/api/revenue` | GET | 月度收入报表 |
| `/api/system-stats` | GET | 全平台统计 |
| `/api/semester-report` | GET | 学期总结报告 |
| `/api/weekly-reports` | GET/POST | 学员周报 |
| `/api/diagnostic-reports` | GET/POST | 诊断报告 |
| `/api/lesson-plans` | GET/POST | AI学案 |

### 工具
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/export` | GET | CSV导出 |
| `/api/import` | POST/PUT | CSV导入 |
| `/api/calendar` | GET | iCal日历导出 |
| `/api/search` | GET | 全局搜索 |
| `/api/notifications` | GET | 通知聚合 |
| `/api/health` | GET | 健康检查 |
| `/api/onboarding` | GET | 新手引导 |
| `/api/activity-logs` | GET | 操作日志 |
| `/api/settings` | GET/PUT | 系统设置 |
| `/api/share` | GET/POST | 分享链接 |
| `/api/studio` | GET | 工作室品牌数据 |
| `/api/events` | GET/POST | 学习活动 |

---

## 🗄️ 数据模型（16张表）

```
User → Account/Session          # 认证
Student → DiagnosticReport       # 分析期
Student → LearningPlan           # 准备期
LessonPlan                       # AI学案
KnowledgePoint                   # 知识点图谱
Course / CourseRegistration      # 执行期（排课）
Attendance                       # 考勤
DailyRecord                      # 学情
MistakeRecord                    # 错题
ExamScore                        # 成绩
Achievement                      # 竞赛成果
LearningReport                   # 周报/报告
Trial                            # 试听线索
StudyEvent / StudyEventParticipant # 学习活动
ActivityLog                      # 操作日志
```

---

## 🧪 测试（49个）

```bash
# 运行所有测试
npx playwright test

# 指定测试
npx playwright test e2e/01-login.spec.ts

# UI 模式
npx playwright test --ui

# 查看报告
npx playwright show-report
```

### 测试覆盖

| 类别 | 数量 |
|------|------|
| 导航/回归 | 2 |
| 核心业务 | 7 |
| 全流程冒烟 | 1 |
| 差异化功能 | 5 |
| 管理工具 | 6 |
| 财务/运营 | 5 |
| 公开页面 | 2 |
| UI组件 | 4 |
| 辅助工具 | 5 |
| 批量操作 | 3 |
| 健康/系统 | 2 |

---

## 🔧 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run test:e2e     # 运行 Playwright 测试
npm run db:push      # 同步数据库schema
npm run db:seed      # 填充初始数据
npm run db:studio    # 打开 Prisma Studio
npm run lint         # 代码检查
```

---

## 📊 项目统计

| 维度 | 数值 |
|------|------|
| API路由 | 43个 |
| UI页面 | 34个 |
| 侧边栏导航 | 23个入口 |
| 数据模型表 | 16张 |
| 核心组件 | 16个 |
| 工具库 | 6个 |
| E2E测试 | 49个（~970+断言） |
| 迭代轮次 | 47轮 |
| 总代码行数 | ~15,000+ |

---

## 📄 许可证

MIT © 2026 拾步工作室
