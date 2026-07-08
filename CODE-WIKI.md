# 拾步 OPC Tutor Suite · Code Wiki

> 项目路径：`d:\02工作\家教工作室\shibu`
> 业务定位：个人家教工作室全周期教学管理系统
> 方法论：OPC 四阶段（分析期 → 准备期 → 执行期 → 结课期）
> 技术栈：Next.js 14 App Router + React 18 + TypeScript + Prisma + NextAuth + Tailwind + Vitest + Playwright + Electron + Tesseract.js

---

## 目录

- [一、项目概述](#一项目概述)
- [二、项目整体架构](#二项目整体架构)
- [三、目录结构](#三目录结构)
- [四、主要模块职责](#四主要模块职责)
- [五、关键类与函数说明](#五关键类与函数说明)
- [六、数据库模型](#六数据库模型)
- [七、依赖关系](#七依赖关系)
- [八、项目运行方式](#八项目运行方式)
- [九、测试体系](#九测试体系)
- [十、CI/CD 流程](#十cicd-流程)
- [十一、环境变量](#十一环境变量)
- [十二、架构特征与技术债务](#十二架构特征与技术债务)

---

## 一、项目概述

### 1.1 业务定位

拾步工作室是一套面向个人家教工作室的一体化管理平台，覆盖学生全生命周期：

- **分析期**：学生建档（主数据底座）+ 学情诊断 + 双轨制学习计划 + 全科成绩录入
- **准备期**：知识点图谱 + AI 学案生成 + 教材章节维护
- **执行期**：排课 / 签到 / 扣课 / 学情 / 错题（含 OCR） / 成绩
- **结课期**：周报 / 学期报告 / 续费管理

### 1.2 项目规模

| 维度 | 数量 |
|---|---|
| API 路由 | 60+（含主数据 CRUD、错题 OCR/分析、学生子路由） |
| UI 页面 | 35+（新增主数据管理页） |
| 侧边栏导航项 | 24+ |
| 数据表 | 28（新增 7 张：5 主数据 + 2 学生关联） |
| 核心组件 | 25+（新增 12 个：主数据选择器 + 学生详情区） |
| 工具库 | 7（新增 score-validation、training-subject-validation） |
| E2E 测试文件 | 56 |
| 单元测试文件 | 4（Vitest，覆盖 courses/mistakes OCR 与分析） |
| 迭代轮次 | 50+ |

### 1.3 品牌信息

- 工作室名："拾步"（shibu）
- Slogan："不是所有工作室，都叫「拾步」"
- 主题色：
  - `shibu`（品牌蓝 `#2C5385`）
  - `confidence`（信心橙 `#F68B1F`）
  - `warm`（暖白 `#F5F5F0`）

### 1.4 最新重大变更（主数据底座改造）

本次迭代完成"学生基础档案主数据底座改造"（详见 `docs/PRD-学生主数据档案.md`）：

- Student 模型移除 `school`/`grade`/`textbook` 三个文本字段，改为 `schoolId`/`gradeId` 外键
- 新增 5 类主数据表：School / Grade / Subject / TextbookVersion / TextbookChapter
- 新增 2 类学生关联表：StudentSubjectRecord（全科成绩）/ StudentTrainingSubject（培训学科）
- 新增错题 OCR（tesseract.js）与分析接口
- 新增 Vitest 单元测试体系
- 种子数据扩展：71 所南海区学校、12 学科、9 年级、58 教材版本、15 教材章节

---

## 二、项目整体架构

### 2.1 架构分层

```
┌────────────────────────────────────────────────────────────┐
│                    客户端 (Browser / Electron)              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │  Next.js App     │  │  React 组件      │  │ Tailwind │ │
│  │  Router (35+页)  │  │  (25+个)         │  │  CSS     │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┘ │
│           │ fetch + useSession  │                          │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
            ▼                      ▼
┌────────────────────────────────────────────────────────────┐
│              Next.js API Routes (60+个, Route Handlers)     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ 认证层   │ │ 业务路由 │ │ 主数据   │ │ 公开/工具接口│  │
│  │ NextAuth │ │ CRUD     │ │ 底座     │ │ share/health │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │            │            │              │           │
│       ▼            ▼            ▼              ▼           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/lib (7个工具库)                                  │  │
│  │  auth | prisma | api-response | activity-log         │  │
│  │  utils | score-validation | training-subject-validation│  │
│  └─────────────────────┬────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────┐
│         Prisma ORM (SQLite / PostgreSQL)                   │
│  28 个 Model · 主数据底座 · 树形知识点 · 级联删除 · 事务保护 │
└────────────────────────────────────────────────────────────┘
```

### 2.2 渲染模式

项目采用 **客户端组件主导** 模式：

- 仅 3 个服务端组件：根布局、dashboard 布局、首页（仅 redirect）
- 其余页面 + 组件均为 `"use client"` 客户端组件
- 数据获取：统一 `fetch + useEffect + useState`，无 SWR / React Query
- 路由保护：客户端 `useSession` + `redirect("/login")`

### 2.3 多端部署形态

| 形态 | 端口 | 入口 | 数据目录 |
|---|---|---|---|
| 开发服务器 | 3000 | `npm run dev` | `cwd/data/dev.db` |
| 生产服务器 | 3000 | `next start` / standalone | `cwd/data/dev.db` |
| Docker 容器 | 3000 | `node server.js` | `/app/data/dev.db` |
| Electron 桌面 | 3080 | `electron/main.js` | `~/.shibu/data/dev.db` |
| Windows .exe | 3000 | SEA / pkg 打包 | `exe同级目录/data` |
| CLI 工具 | - | `cli/shibu.js` | - |

---

## 三、目录结构

```
shibu/
├── src/                          # 源代码主目录
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # 60+ API 路由
│   │   │   ├── master-data/      # 主数据底座（新增）
│   │   │   │   ├── schools/      # 学校（含 import、[id]/grades 联动）
│   │   │   │   ├── grades/       # 年级
│   │   │   │   ├── subjects/     # 学科
│   │   │   │   ├── textbooks/    # 教材版本
│   │   │   │   └── chapters/     # 教材章节（含 import）
│   │   │   ├── mistakes/         # 错题（新增 ocr/、analyze/）
│   │   │   └── students/[id]/    # 学生（新增 scores/、training-subjects/）
│   │   ├── dashboard/
│   │   │   ├── master-data/      # 主数据管理页（新增，5 Tab）
│   │   │   │   ├── tabs/         # 5 个 Tab 组件
│   │   │   │   └── types.ts
│   │   │   └── ...               # 其他业务页面
│   │   ├── login/                # 登录页
│   │   ├── parent/[token]/       # 家长 H5 查看页
│   │   ├── studio/               # 工作室公开品牌页
│   │   ├── layout.tsx            # 根布局（服务端组件）
│   │   ├── page.tsx              # 首页（redirect 到 /dashboard）
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── student-detail/       # 学生详情区组件（新增 8 个）
│   │   │   ├── CurrentScoresSection.tsx
│   │   │   ├── ExamRangeSelector.tsx
│   │   │   ├── ScoreBatchForm.tsx
│   │   │   ├── ScoreChart.tsx
│   │   │   ├── ScoreFormModal.tsx
│   │   │   ├── ScoreList.tsx
│   │   │   ├── TrainingScheduleSection.tsx
│   │   │   ├── TrainingSubjectSection.tsx
│   │   │   └── shared.ts
│   │   ├── AuthProvider.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── GlobalSearch.tsx
│   │   ├── GradeSelector.tsx    # 新增
│   │   ├── KeyboardShortcuts.tsx
│   │   ├── NavSearch.tsx
│   │   ├── SchoolCreateModal.tsx # 新增
│   │   ├── SchoolSelector.tsx   # 新增
│   │   ├── ScoreChart.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SimilarProblems.tsx
│   │   ├── Skeleton.tsx
│   │   ├── StudentTimeline.tsx
│   │   └── SubjectTextbookCard.tsx # 新增
│   ├── lib/                      # 7 个工具库
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── api-response.ts
│   │   ├── activity-log.ts
│   │   ├── utils.ts
│   │   ├── score-validation.ts          # 新增
│   │   └── training-subject-validation.ts # 新增
│   ├── __tests__/                # 单元测试（新增）
│   │   ├── api/
│   │   │   ├── courses.route.test.ts
│   │   │   ├── courses.batch.route.test.ts
│   │   │   ├── mistakes.ocr.route.test.ts
│   │   │   └── mistakes.analyze.route.test.ts
│   │   └── helpers/mocks.ts
│   └── types/
│       └── next-auth.d.ts
├── prisma/
│   ├── schema.prisma             # 28 个数据模型
│   ├── seed.ts                   # 种子数据（管理员+知识点+主数据）
│   ├── migrations/               # Prisma 迁移（新增）
│   │   ├── 20260701010414_build_student_master_data/
│   │   └── 20260702222304_add_semester_to_score_record/
│   └── dev.db.bak.20260701
├── docs/                         # 项目文档（新增）
│   └── PRD-学生主数据档案.md
├── e2e/                          # 56 个 Playwright E2E 测试
├── electron/
│   └── main.js                   # Electron 主进程
├── runtime/                      # 多模态运行器
│   ├── core_app.js
│   ├── env_detector.js
│   ├── run.bat
│   └── simulate.bat
├── cli/
│   └── shibu.js                  # 统一 CLI 入口
├── scripts/                      # 构建/修复脚本
│   ├── build-exe.js
│   ├── fix-next-build-traces.js
│   └── shibu-cli.bat/.sh
├── .github/workflows/ci.yml      # GitHub Actions CI
├── Dockerfile
├── docker-compose.yml
├── electron-builder.yml
├── next.config.mjs
├── tailwind.config.ts
├── playwright.config.ts
├── vitest.config.ts              # Vitest 单元测试配置（新增）
├── tsconfig.json
└── package.json
```

---

## 四、主要模块职责

### 4.1 后端 API 路由模块

#### 4.1.1 核心业务 CRUD 路由

| 路径 | 方法 | 职责 | 关键参数 |
|---|---|---|---|
| `/api/students` | GET, POST | 学生列表/新建 | `status`, `q`, `grade` |
| `/api/students/[id]` | GET, PUT, DELETE | 学生详情/更新/删除 | - |
| `/api/students/[id]/timeline` | GET | 学生全生命周期时间线 | - |
| `/api/students/[id]/scores` | GET, POST | 学生全科成绩列表/录入 | `subjectId`, `examType` |
| `/api/students/[id]/scores/[recordId]` | PUT, DELETE | 成绩更新/删除 | - |
| `/api/students/[id]/scores/batch` | POST | 批量录入成绩（事务） | - |
| `/api/students/[id]/training-subjects` | GET, POST | 培训学科列表/标记 | - |
| `/api/students/[id]/training-subjects/[recordId]` | PUT, DELETE | 培训学科更新/删除 | - |
| `/api/courses` | GET, POST | 课程列表/创建（含冲突检测） | `today`, `studentId`, `start`, `end` |
| `/api/courses/[id]` | PUT, DELETE | 课程更新（签到+扣课事务）/删除 | - |
| `/api/courses/batch` | POST | 批量排课（按周几循环） | - |
| `/api/courses/checkin` | POST | 批量签到（原子扣课） | - |
| `/api/records` | GET, POST | 学情列表/创建（去重检查） | `studentId`, `limit`, `offset` |
| `/api/records/[id]` | PUT, DELETE | 学情更新/删除 | - |
| `/api/records/batch` | POST | 批量创建学情 | - |
| `/api/mistakes` | GET, POST | 错题列表/创建 | `studentId`, `status`, `errorType` |
| `/api/mistakes/[id]` | PUT, DELETE | 错题更新/删除 | - |
| `/api/mistakes/[id]/similar` | GET, POST | 同类题推荐/记录练习 | - |
| `/api/mistakes/ocr` | POST | 错题图片 OCR 识别（tesseract.js） | `image` (base64) |
| `/api/mistakes/analyze` | POST | 错题文本分析（正则匹配） | `text` |
| `/api/scores` | GET, POST | 旧版成绩列表/录入 | `studentId` |
| `/api/registrations` | GET, POST | 课程包列表/创建 | `studentId` |
| `/api/registrations/[id]` | PUT | 课程包续费/变更 | - |
| `/api/trials` | GET, POST | 试听线索列表/创建 | - |
| `/api/trials/[id]` | PUT, DELETE | 试听更新/删除 | - |
| `/api/knowledge-points` | GET, POST | 知识点列表/创建 | - |
| `/api/knowledge-points/[id]` | DELETE | 删除知识点（级联置空） | - |
| `/api/learning-plans` | GET, POST | 双轨制学习计划 | `studentId` |
| `/api/lesson-plans` | GET, POST | AI 学案生成（模板） | `studentId` |
| `/api/achievements` | GET, POST | 竞赛成果 | `studentId` |
| `/api/events` | GET, POST | 学习活动 | - |
| `/api/diagnostic-reports` | GET, POST | 学情诊断报告 | `studentId` |

#### 4.1.2 主数据底座路由（新增）

| 路径 | 方法 | 职责 | 关键设计 |
|---|---|---|---|
| `/api/master-data/schools` | GET, POST | 学校列表/新增 | 默认 district=南海区，`sortSchoolsByLevel` 高中重点优先 |
| `/api/master-data/schools/[id]` | GET, PUT, DELETE | 学校 CRUD | PUT 白名单字段过滤 |
| `/api/master-data/schools/import` | POST | CSV 批量导入学校 | 按 name+district 去重 |
| `/api/master-data/schools/[id]/grades` | GET | 学校→年级联动 | 按 school.level 匹配 Grade.schoolTypes contains |
| `/api/master-data/grades` | GET, POST | 年级列表/新增 | 按 order ASC |
| `/api/master-data/grades/[id]` | GET, PUT, DELETE | 年级 CRUD | PUT 的 order 强制 Number() |
| `/api/master-data/subjects` | GET, POST | 学科列表/新增 | 可选 level 过滤 |
| `/api/master-data/subjects/[id]` | GET, PUT, DELETE | 学科 CRUD | - |
| `/api/master-data/textbooks` | GET, POST | 教材版本列表/新增 | region+gradeId+subjectId 组合过滤 |
| `/api/master-data/textbooks/[id]` | GET, PUT, DELETE | 教材版本 CRUD | 唯一约束：region+gradeId+subjectId |
| `/api/master-data/chapters` | GET, POST | 章节树形列表/新增 | `buildChapterTree` 按 parentChapterId 组装 |
| `/api/master-data/chapters/[id]` | GET, PUT, DELETE | 章节 CRUD | - |
| `/api/master-data/chapters/import` | POST | CSV 批量导入章节 | parentChapterNo 匹配 chapterNo |

#### 4.1.3 聚合分析/报告类路由

| 路径 | 方法 | 职责 |
|---|---|---|
| `/api/dashboard` | GET | 工作台聚合（学生数/今日课/错题/掌握度趋势/近期成绩） |
| `/api/finance` | GET | 财务总览（预收款/已确认收入/递延收入/续费预警/月度趋势） |
| `/api/revenue` | GET | 月度收入报表（按月汇总已确认收入与新增签约） |
| `/api/reports` | GET | 学生学习报告（`studentId` 必填） |
| `/api/weekly-reports` | GET, POST | 周报列表/生成（本周 vs 上周对比 + 自然语言总结） |
| `/api/semester-report` | GET | 学期报告（8 路并行查询，支持时间范围） |
| `/api/system-stats` | GET | 全平台数据总览（15+ 维度统计） |
| `/api/notifications` | GET | 通知汇总（今日课程/续费预警/待记录/竞赛成果） |
| `/api/onboarding` | GET | 新手引导状态（6 步检查） |
| `/api/settings` | GET, PUT | 系统信息/修改密码 |
| `/api/activity-logs` | GET | 操作日志（分页） |

#### 4.1.4 工具/公开接口

| 路径 | 方法 | 鉴权 | 职责 |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | - | NextAuth 认证入口 |
| `/api/health` | GET | 否 | 健康检查（数据库/表/数据/环境） |
| `/api/studio` | GET | 否 | 工作室公开主页数据 |
| `/api/share` | POST | 是 | 生成分享链接（30 天有效） |
| `/api/share` | GET | token | 家长端分享数据 |
| `/api/calendar` | GET | 是 | 导出 iCal 日历文件 |
| `/api/export` | GET | 是 | 导出 CSV（students/records/mistakes/scores） |
| `/api/import` | POST, PUT | 是 | CSV 导入/解析预览 |
| `/api/search` | GET | 是 | 全局搜索（5 类资源并行） |

### 4.2 前端页面模块

#### 4.2.1 全局入口（5 个）

| 路径 | 类型 | 职责 |
|---|---|---|
| `app/layout.tsx` | 服务端 | 根布局，包裹 `AuthProvider` + `Toaster` |
| `app/page.tsx` | 服务端 | 首页，`redirect("/dashboard")` |
| `app/login/page.tsx` | 客户端 | 登录页，预填管理员账号 |
| `app/parent/[token]/page.tsx` | 客户端 | 家长 H5 查看页（token 鉴权） |
| `app/studio/page.tsx` | 客户端 | 工作室公开品牌展示页 |

#### 4.2.2 Dashboard 业务页面（27 个）

包含原有 26 个业务页面 + 新增 `dashboard/master-data/page.tsx`（主数据管理页，5 Tab：schools/grades/subjects/textbooks/chapters）。

完整页面清单参见前版 wiki 的 4.2.2 节，新增页面：

| 路径 | 职责 |
|---|---|
| `dashboard/master-data/page.tsx` | 主数据管理页（Tab 容器） |
| `dashboard/master-data/tabs/SchoolsTab.tsx` | 学校 Tab（搜索 + 镇街筛选 + CSV 导入） |
| `dashboard/master-data/tabs/GradesTab.tsx` | 年级 Tab（schoolTypes 数组多选） |
| `dashboard/master-data/tabs/SubjectsTab.tsx` | 学科 Tab（category/examTypes/applicableLevels） |
| `dashboard/master-data/tabs/TextbooksTab.tsx` | 教材版本 Tab（region+gradeId+subjectId 三级联动） |
| `dashboard/master-data/tabs/ChaptersTab.tsx` | 章节 Tab（树形展示 + 递归渲染 + 父章节下拉带缩进） |
| `dashboard/master-data/types.ts` | 共享类型与选项常量（SCHOOL_LEVELS / SUBJECT_CATEGORIES / EXAM_TYPES / APPLICABLE_LEVELS） |

### 4.3 工具库模块（src/lib/）

| 文件 | 职责 |
|---|---|
| `auth.ts` | NextAuth 配置（PrismaAdapter + Credentials Provider + JWT Session） |
| `prisma.ts` | Prisma 客户端单例（防 HMR 重复连接） |
| `api-response.ts` | 统一响应 helper（实际使用率低） |
| `activity-log.ts` | 操作日志写入（失败不影响主流程） |
| `utils.ts` | 通用工具（cn / formatDate / getMasteryLabel 等） |
| `score-validation.ts` | **新增**：成绩校验（validateScoreInput / buildScoreData / mapScoreRecord / validateSemester） |
| `training-subject-validation.ts` | **新增**：培训学科校验（validateTrainingSubjectInput / buildTrainingSubjectData / validateTrainingSubjectUpdate / buildTrainingSubjectUpdateData） |

### 4.4 运行时模块

| 文件 | 职责 |
|---|---|
| `runtime/env_detector.js` | 多模态环境检测（electron/exe/docker/dev/server） |
| `runtime/core_app.js` | 核心启动器（自动选择 standalone / next start） |
| `cli/shibu.js` | 统一 CLI 入口（server/desktop/docker/backup/build） |
| `electron/main.js` | Electron 主进程（窗口 + 托盘 + 子进程管理） |
| `scripts/build-exe.js` | Windows .exe 打包（Node.js SEA + postject） |
| `scripts/fix-next-build-traces.js` | Next.js Windows 构建补丁（11 处修复） |

---

## 五、关键类与函数说明

### 5.1 认证模块（src/lib/auth.ts）

#### `authOptions` — NextAuth 配置对象

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [CredentialsProvider({...})],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: ({ token, user }) => { token.role = user.role; return token; },
    session: ({ session, token }) => {
      (session.user as any).role = token.role;
      (session.user as any).id = token.sub;
      return session;
    }
  },
  pages: { signIn: "/login" }
};
```

#### `authorize(credentials)` — 凭证校验函数

- 入参：`{ email, password }`
- 流程：`prisma.user.findUnique` → `bcrypt.compare` → 返回 user 对象

### 5.2 数据库模块（src/lib/prisma.ts）

#### `prisma` — PrismaClient 单例

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 5.3 成绩校验模块（src/lib/score-validation.ts）— 新增

| 函数 | 用途 |
|---|---|
| `validateSemester(semester)` | 校验学期字段，合法值 `["first", "second"]`，缺省返回 true |
| `validateScoreInput(body)` | 校验成绩输入：subjectId/examName/examDate/examType 必填，score/fullScore 必须 number |
| `buildScoreData(body, studentId)` | 构造 Prisma 写入数据，semester 缺省 "first"，examDate 转 Date |
| `mapScoreRecord(r, subjectName)` | 扁平化记录，注入 subjectName（因 StudentSubjectRecord 无 subject 关系字段） |

> `examType` 不再用枚举校验，允许用户自定义文本（周测/测验/月考/期中/期末/模拟/中考/高考/竞赛）。`examRange` 始终可选（不再按 examType 强制必填）。

### 5.4 培训学科校验模块（src/lib/training-subject-validation.ts）— 新增

| 函数 | 用途 |
|---|---|
| `validateTrainingSubjectInput(body)` | POST 校验：subjectId/startDate 必填，isAtStudio 必须 boolean，status 在 `["active", "ended"]` 内 |
| `validateTrainingSubjectUpdate(body)` | PUT 校验：不校验 subjectId（不可改） |
| `buildTrainingSubjectData(body, studentId)` | 构造写入数据，isAtStudio 缺省 true，status 缺省 "active" |
| `buildTrainingSubjectUpdateData(body)` | **关键逻辑**：status 改为 "ended" 且 endDate 未传时，自动设为今日 |

```typescript
// 结课自动补 endDate 为今日
if (body.status === "ended" && body.endDate === undefined) {
  data.endDate = new Date();
} else if (body.endDate !== undefined) {
  data.endDate = body.endDate ? new Date(body.endDate) : null;
}
```

### 5.5 操作日志模块（src/lib/activity-log.ts）

#### `logActivity(params)` — 异步日志写入

- 关键设计：日志失败仅 `console.error`，不影响主流程
- 写入表：`prisma.activityLog.create`

### 5.6 通用工具模块（src/lib/utils.ts）

| 函数 | 用途 |
|---|---|
| `cn(...inputs)` | Tailwind 类名合并（clsx + tailwind-merge） |
| `formatDate(date)` | 中文日期格式化 |
| `formatDateTime(date)` | 中文日期时间格式化 |
| `getMasteryLabel(level)` | 1-5 掌握度映射中文 |
| `getMoodLabel(mood)` | good/normal/bad → 中文 |
| `getErrorTypeLabel(type)` | careless/concept/approach/unknown → 中文错因 |
| `getErrorTypeColor(type)` / `getMasteryColor(level)` | 颜色映射 |

### 5.7 关键业务函数

#### 课程签到事务（`courses/[id]/route.ts` PUT）

```typescript
const course = await prisma.$transaction(async (tx) => {
  const before = await tx.course.findUnique({ where: { id: params.id } });
  if (!before) throw new Error("课程不存在");
  const updated = await tx.course.update({ where: { id: params.id }, data });
  if (body.status === "completed") {
    await tx.attendance.upsert({ where: { courseId: params.id }, ... });
    if (updated.registrationId && before.status !== "completed") {
      // 原子检测 remainingHours > 0，防止并发重复扣课
      const regResult = await tx.courseRegistration.updateMany({
        where: { id: updated.registrationId, remainingHours: { gt: 0 } },
        data: { usedHours: { increment: 1 }, remainingHours: { decrement: 1 } },
      });
      if (regResult.count === 0) throw new Error("课时已用尽，无法完成签到");
    }
  }
  return updated;
});
```

#### 排课冲突检测（`courses/route.ts` POST）

```typescript
const conflict = await prisma.course.findFirst({
  where: {
    studentId, status: "scheduled",
    startTime: { lt: endTime }, endTime: { gt: startTime },
  },
});
if (conflict && !(body.overwrite && body.conflictCourseId === conflict.id)) {
  return NextResponse.json({ error: "排课冲突", conflict: {...} }, { status: 409 });
}
```

#### 学校列表分组排序（`master-data/schools/route.ts`）— 新增

```typescript
function sortSchoolsByLevel(list: School[]): School[] {
  // 非高中按 town ASC 排序
  const lower = list.filter((s) => s.level !== "senior")
    .sort((a, b) => (a.town ?? "").localeCompare(b.town ?? ""));
  // 高中按 isKey DESC + keyLevel ASC 排序（重点校优先）
  const senior = list.filter((s) => s.level === "senior")
    .sort((a, b) => Number(b.isKey) - Number(a.isKey) || (a.keyLevel ?? "").localeCompare(b.keyLevel ?? ""));
  return [...lower, ...senior];
}
```

#### 学校→年级联动（`master-data/schools/[id]/grades/route.ts`）— 新增

```typescript
// 先查 School.level，再用 Grade.schoolTypes contains level 过滤
const school = await prisma.school.findUnique({ where: { id: params.id } });
const grades = await prisma.grade.findMany({
  where: { schoolTypes: { contains: school.level } },
  orderBy: { order: "asc" },
});
```

#### 章节树构建（`master-data/chapters/route.ts`）— 新增

```typescript
function buildChapterTree(list: TextbookChapter[]): ChapterNode[] {
  const map = new Map<string, ChapterNode>();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: ChapterNode[] = [];
  list.forEach((c) => {
    if (c.parentChapterId && map.has(c.parentChapterId)) {
      map.get(c.parentChapterId)!.children.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  });
  return roots;
}
```

#### 错题 OCR（`mistakes/ocr/route.ts`）— 新增

```typescript
// 1. 剥离 data URL 前缀
const base64Data = body.image.replace(/^data:image\/\w+;base64,/, "");
const imageBuffer = Buffer.from(base64Data, "base64");
// 2. 创建 tesseract worker（chi_sim+eng）
const { createWorker } = await import("tesseract.js");
const worker = await createWorker("chi_sim+eng");
// 3. 识别
const { data } = await worker.recognize(imageBuffer);
await worker.terminate();
// 4. 文本清洗
const rawText = data.text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
// 5. 返回
return NextResponse.json({ data: { rawText }, message: `识别到 ${rawText.length} 个字符` });
```

- 错误处理：OCR 异常返回 422，空文本返回 422，顶层异常返回 500

#### 错题分析（`mistakes/analyze/route.ts`）— 新增

- **纯规则匹配**，未接入外部 AI API（注释提到后续可接入）
- `answerMarkers`：7 个正则匹配正确答案标记（答/答案/解/解答/解析/正确答案/参考答案 + 冒号）
- `wrongMarkers`：3 个正则匹配错误答案标记（学生/我的/错误...答案 + 冒号）
- 逐行扫描，先匹配正确答案，再匹配错误答案，其余作为题目内容
- `searchQuery` = 学科 + question 前 100 字符（去换行）
- `confidence`：找到答案标记为 "high"，否则 "low"

> **已知 BUG**：`/答案[：:]\s*(.+)/` 未锚定行首，"错误答案：5" 也会被匹配为 correctAnswer。已用 `[BUG]` 测试用例记录当前行为。

#### 成绩批量录入事务（`students/[id]/scores/batch/route.ts`）— 新增

```typescript
// 顶部共用字段 + 多行记录
const created = await prisma.$transaction(async (tx) => {
  const results = [];
  for (const record of body.records) {
    const r = await tx.studentSubjectRecord.create({
      data: buildScoreData({ ...body, ...record }, params.id),
    });
    results.push(r);
  }
  return results;
});
```

#### 学生时间线聚合（`students/[id]/timeline/route.ts`）

- 并行查询 9 个数据源（Promise.all）
- 聚合为统一 `events` 数组，事件类型：milestone / assessment / plan / course / record / mistake / score / achievement / report
- 按时间倒序排列，附带 `stats` 统计

#### 周报生成（`weekly-reports/route.ts` POST）

- 时间范围：本周（周一开始）vs 上周对比
- 并行查询 4 个数据源（courses / records / mistakes / scores）
- 自然语言总结生成

#### 财务计算（`finance/route.ts`）

- `totalPrepayments`：所有课程包价格之和
- `recognizedRevenue`：按 `usedHours/totalHours` 比例确认的收入
- `deferredRevenue`：`totalPrepayments - recognizedRevenue`
- 续费预警：`remainingHours <= 3 && status === "active"`

#### 分享 token 生成（`share/route.ts` POST）

```typescript
const token = Buffer.from(`${studentId}:${Date.now()}:${Math.random()}`)
  .toString("base64url");
// 30 天有效期，无需服务端存储（timestamp 嵌入 token）
```

### 5.8 前端组件关键函数

#### `Sidebar.tsx`

- 内置 24+ 个导航项配置（`href` / `label` / `icon`）
- 基于 `usePathname()` 严格匹配当前路由高亮

#### `Breadcrumb.tsx`

- 内置 `LABEL_MAP`（30+ 路由段 → 中文映射）

#### `GlobalSearch.tsx`

- 快捷键 `⌘+Shift+F` / `Ctrl+Shift+F` 触发
- 300ms 防抖 `fetch /api/search?q=xxx`

#### `NavSearch.tsx`

- 快捷键 `⌘K` / `Ctrl+K` 触发
- 内置 `NAV_ITEMS`（19+ 个页面，含 `label` / `href` / `keywords`）

#### `SchoolSelector.tsx`（新增）

- 检索式学校选择器，300ms 防抖搜索
- `touched` 状态区分"用户输入"与"外部回显"
- 下拉底部固定"添加新学校"按钮

#### `GradeSelector.tsx`（新增）

- 年级联动下拉，schoolId 变化时拉取可选年级
- 支持回显（value 不在列表时展示 initialGradeName）

#### `SubjectTextbookCard.tsx`（新增）

- 全科+教材版本展示卡
- `saveTextbookVersion` 根据 textbookId 是否存在自动选择 PUT 或 POST

#### `student-detail/ScoreChart.tsx`（新增）

- 纯 SVG 折线图，按得分率（%）绘制
- 培训学科实线粗 2.5px 主色，非培训虚线 1.5px 灰色
- `MIN_RECORDS = 3` 不足 3 条显示提示
- `buildSeries` 按学科分组，`collectAllDates` 收集所有日期升序

#### `student-detail/ExamRangeSelector.tsx`（新增）

- 考试范围章节多选树
- 按 gradeId+subjectId 联动加载教材版本→章节树
- 递归渲染带缩进的复选框

#### `student-detail/TrainingSubjectSection.tsx`（新增）

- 培训学科管理，添加/结课/恢复在读
- 添加时过滤已标记学科
- `useEffect` 监听 list 变化，通过 `onTrainingSubjectsChange` 回调通知父组件

#### `student-detail/ScoreList.tsx`（新增）

- 成绩列表按学科分组，每组内 examDate DESC
- 分数颜色按得分率（≥85% 绿 / ≥60% 蓝 / <60% 红）

---

## 六、数据库模型

### 6.1 配置

- **Generator**：`prisma-client-js`
- **DataSource**：`sqlite`（开发），`postgresql`（CI）
- **无 enum 类型**：所有"枚举"语义用 `String` + 注释表示
- **迁移目录**：`prisma/migrations/`（新增，2 个迁移）

### 6.2 数据模型清单（28 个 model）

#### 6.2.1 认证相关（NextAuth 标准 4 表）

**User** — 用户

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id @default(cuid()) | |
| name | String? | | |
| email | String? | @unique | |
| emailVerified | DateTime? | | |
| image | String? | | |
| passwordHash | String? | | bcrypt 哈希 |
| role | String | "admin" | admin \| teacher |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Account** / **Session** / **VerificationToken** — 标准 NextAuth 表（略）

#### 6.2.2 分析期 — 学生主数据 & 诊断

**Student** — 学生主数据（核心实体，**已重构**）

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id | |
| name | String | | 姓名 |
| parentGoal | String? | | 家长期望 |
| studentGoal | String? | | 学生目标 |
| currentScore | String? | | 当前成绩/排名 |
| personality | String? | | 性格特点 |
| weakness | String? | | 薄弱点 |
| summary | String? | | 学习情况 |
| parentName | String? | | 家长姓名 |
| parentPhone | String? | | 联系电话 |
| parentWechat | String? | | 微信 |
| **schoolId** | **String?** | | **学校外键（替代原 school 文本字段）** |
| **gradeId** | **String** | | **年级外键（替代原 grade 文本字段）** |
| status | String | "active" | active \| paused \| ended |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

> **重大变更**：移除了原 `school`/`grade`/`textbook` 三个文本字段，改为 `schoolId`/`gradeId` 外键关联主数据表。

关系：
- 主数据：`school School? @relation("StudentSchool")`、`grade Grade @relation("StudentGrade")`
- 新增：`subjectRecords StudentSubjectRecord[]`、`trainingSubjects StudentTrainingSubject[]`
- 原有：diagnosticReports / learningPlans / dailyRecords / mistakeRecords / examScores / courseRegistrations / courses / learningReports / achievements / studyEventParticipants / convertedTrials

**DiagnosticReport** / **LearningPlan** — 同前版（略）

#### 6.2.3 主数据底座（新增 5 表）

**School** — 学校主数据

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id | |
| name | String | | 学校全称 |
| district | String | | 区：南海区/禅城区等 |
| town | String? | | 镇街：桂城/大沥/狮山等 |
| level | String | | primary \| junior \| senior \| nine_year |
| isKey | Boolean | false | 重点标记（高中用） |
| keyLevel | String? | | 省一级/市一级/区一级 |
| address | String? | | |
| source | String | "manual" | manual \| web_search \| gov_data |
| verified | Boolean | false | 是否人工点选确认 |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

- 关系：`students Student[] @relation("StudentSchool")`
- 外键约束：Student.schoolId `ON DELETE SET NULL`（学校删除学生保留）

**Grade** — 年级主数据

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id | |
| name | String | | 小四/小五/.../高三 |
| level | String | | primary \| junior \| senior |
| order | Int | | 排序：小四=4,...,高三=12 |
| schoolTypes | String | | 适用的学校 level，逗号分隔 |

- 关系：`students Student[] @relation("StudentGrade")`
- 外键约束：Student.gradeId `ON DELETE RESTRICT`（年级被引用时不可删）

**Subject** — 学科主数据

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id | |
| name | String | | 语文/数学/英语/物理/... |
| category | String | | basic \| competition \| qiangji |
| examTypes | String | | 逗号分隔：mid_term,final,zhongkao,gaokao,aoshu,qiangji |
| applicableLevels | String | | 适用的学段：primary,junior,senior |
| isCompetition | Boolean | false | |

**TextbookVersion** — 教材版本主数据

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | @id |
| region | String | 地区：南海区/禅城区（默认南海区） |
| gradeId | String | |
| subjectId | String | |
| version | String | 人教版/北师大版/苏教版/粤教版 |
| publisher | String? | |

- 约束：`@@unique([region, gradeId, subjectId], name: "textbook_version_unique")`

**TextbookChapter** — 教材章节主数据

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | @id |
| textbookVersionId | String | 关联 TextbookVersion |
| chapterNo | String | 章节号：1, 2, 1.1 |
| chapterName | String | 章节名：如"有理数" |
| parentChapterId | String? | 父章节，支持多级 |
| order | Int | 排序 |

- 约束：`@@unique([textbookVersionId, chapterNo], name: "textbook_chapter_unique")`

#### 6.2.4 学生主数据关联（新增 2 表）

**StudentSubjectRecord** — 学生全科成绩记录

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id | |
| studentId | String | | |
| subjectId | String | | |
| score | Float | | 分数 |
| fullScore | Float | | 满分 |
| rank | String? | | 排名/等级 |
| semester | String | "first" | first=上学期, second=下学期 |
| examType | String | | 考试类型（用户自定义文本） |
| examDate | DateTime | | |
| examName | String | | 考试名称（必填） |
| examRange | String? | | 考试范围：JSON 数组，存 TextbookChapter.id 列表 |
| note | String? | | |
| createdAt | DateTime | @default(now()) | |

- 关系：`student Student @relation(... onDelete: Cascade)`
- **注意**：无 subject 关系字段，需调用方单独查询 Subject 表后内存合并 subjectName

**StudentTrainingSubject** — 学生培训学科

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| id | String | @id | |
| studentId | String | | |
| subjectId | String | | |
| isAtStudio | Boolean | true | 是否在工作室上课 |
| startDate | DateTime | | |
| endDate | DateTime? | | 结课日期 |
| status | String | "active" | active \| ended |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

- 关系：`student Student @relation(... onDelete: Cascade)`
- 约束：`@@unique([studentId, subjectId], name: "student_training_subject_unique")`

#### 6.2.5 准备期 — 知识点 & 学案

**KnowledgePoint** — 知识点（树形结构，自引用 parent/children）

**LessonPlan** — AI 学案（同前版，studentId 无外键约束）

#### 6.2.6 执行期 — 排课/考勤/学情/错题/成绩

**CourseRegistration** / **Course** / **Attendance** / **DailyRecord** / **MistakeRecord** / **ExamScore** — 同前版（略）

#### 6.2.7 结课期 — 报告/续费

**LearningReport** / **Achievement** — 同前版（略）

#### 6.2.8 CRM — 试听转化

**Trial** — 同前版（略）

#### 6.2.9 学习活动

**StudyEvent** / **StudyEventParticipant** — 同前版（略）

#### 6.2.10 审计

**ActivityLog** — 同前版（userId 无外键约束）

### 6.3 关系总览

| 类型 | 关系 |
|---|---|
| 一对一 | Course ↔ Attendance、Course ↔ DailyRecord |
| 一对多 | User → Account/Session、Student → 14 子表（含新增 subjectRecords/trainingSubjects）、School → Student、Grade → Student |
| 自引用 | KnowledgePoint.parentId → KnowledgePoint（树形）、TextbookChapter.parentChapterId → TextbookChapter（树形） |
| 多对多（中间表） | StudyEvent ⟷ Student 通过 StudyEventParticipant |
| 级联删除 | Student 关系 onDelete: Cascade；School→Student 为 SetNull；Grade→Student 为 Restrict；KnowledgePoint→MistakeRecord 为 SetNull |

### 6.4 Prisma 迁移（新增）

| 迁移 | 内容 |
|---|---|
| `20260701010414_build_student_master_data` | 全量建表迁移，28 张表（含 5 张主数据表 + 2 张学生关联表） |
| `20260702222304_add_semester_to_score_record` | 给 StudentSubjectRecord 表增加 semester 字段（默认 'first'），SQLite 标准 ALTER TABLE 模式（建新表→迁移数据→删旧表→重命名） |

### 6.5 种子数据（prisma/seed.ts）

种子脚本按依赖顺序执行：管理员账号 → 知识点 → 主数据（年级→学科→学校→教材版本→教材章节）。

| 类别 | 数量 | 说明 |
|---|---|---|
| 管理员账号 | 1 | `admin@shibu.com` / `shibu123456`（bcrypt 12 轮） |
| 数学知识点 | 20 | 初中数学章节级（level=2） |
| 年级 | 9 | 小四~高三，带 schoolTypes 逗号字符串 |
| 学科 | 12 | 10 基础学科 + 2 竞赛学科（奥数/信息学奥赛） |
| 学校 | 71 | 南海区 3 镇街（桂城 28 + 狮山 28 + 丹灶 15） |
| 教材版本 | 58 | 南海区，来源电子课本网 dzkbw.com |
| 教材章节 | 15 | 南海区初一数学人教版（上册 4 章 + 下册 6 章 + 拆分 5 章） |

> 注：seed 中出现 `complete_sec`（完全中学）学段，但前端 `SCHOOL_LEVELS` 常量只有 primary/junior/senior/nine_year 四类，存在不一致。

---

## 七、依赖关系

### 7.1 生产依赖（dependencies）

| 依赖 | 版本 | 用途 |
|---|---|---|
| next | ^14.2.18 | Next.js 14 App Router 框架 |
| react / react-dom | ^18.3.1 | React 18 |
| @prisma/client | ^5.22.0 | Prisma ORM 客户端 |
| @next-auth/prisma-adapter | ^1.0.7 | NextAuth Prisma 适配器 |
| next-auth | ^4.24.8 | 认证（Credentials Provider） |
| bcryptjs | ^2.4.3 | 密码哈希 |
| @radix-ui/react-* | 多个 | 无障碍 UI 原语 |
| class-variance-authority | ^0.7.1 | 组件变体 |
| clsx | ^2.1.1 | className 合并 |
| tailwind-merge | ^2.5.5 | Tailwind 类冲突合并 |
| tailwindcss-animate | ^1.0.7 | Tailwind 动画插件 |
| lucide-react | ^0.453.0 | 图标库 |
| date-fns | ^3.6.0 | 日期处理 |
| zod | ^3.23.8 | Schema 校验 |
| react-hot-toast | ^2.4.1 | Toast 通知 |
| **tesseract.js** | **^7.0.0** | **新增：OCR 文字识别（错题图片识别）** |

### 7.2 开发依赖（devDependencies）

| 依赖 | 版本 | 用途 |
|---|---|---|
| typescript | ^5.6.3 | TypeScript |
| @types/{node,react,react-dom,bcryptjs} | - | 类型定义 |
| prisma | ^5.22.0 | Prisma CLI |
| tsx | ^4.19.2 | TS 脚本执行器（seed.ts） |
| tailwindcss | ^3.4.14 | Tailwind CSS |
| postcss | ^8.4.47 | CSS 后处理器 |
| autoprefixer | ^10.4.20 | 自动加前缀 |
| eslint | ^8.57.1 | 代码检查 |
| eslint-config-next | ^14.2.18 | Next.js ESLint 配置 |
| @playwright/test | ^1.48.0 | E2E 测试框架 |
| **vitest** | **^1.6.1** | **新增：单元测试框架** |
| **@vitest/coverage-v8** | **^1.6.1** | **新增：Vitest 覆盖率收集** |

### 7.3 隐式依赖（脚本调用但未声明）

| 依赖 | 用途 |
|---|---|
| electron | 桌面应用运行时 |
| electron-builder | Electron 打包 |
| postject | Node.js SEA 注入 |
| pkg | 备选 exe 打包（Node < 20 回退） |

### 7.4 内部模块依赖关系

```
所有 API 路由 ──→ @/lib/prisma      （数据库）
大多数 API 路由 ──→ @/lib/auth       （authOptions, getServerSession）
写操作路由 ──→ @/lib/activity-log   （logActivity）
成绩子路由 ──→ @/lib/score-validation       （新增）
培训学科子路由 ──→ @/lib/training-subject-validation （新增）
错题 OCR 路由 ──→ tesseract.js              （新增）
前端工具 ──→ @/lib/utils           （cn, formatDate 等）
```

### 7.5 Prisma 模型依赖图

```
User
  ├── Account (1:N)
  ├── Session (1:N)
  └── ActivityLog (1:N, userId 无 @relation)

School ──┐
Grade  ──┤
Subject ─┤
         │ Student (核心实体)
         │  ├── schoolId → School (N:1, SetNull)
         │  ├── gradeId → Grade (N:1, Restrict)
         │  ├── subjectRecords StudentSubjectRecord[] (1:N, Cascade)
         │  ├── trainingSubjects StudentTrainingSubject[] (1:N, Cascade)
         │  ├── diagnosticReports (1:N, Cascade)
         │  ├── learningPlans (1:N, Cascade)
         │  ├── courseRegistrations (1:N, Cascade) → Course (1:N)
         │  ├── courses (1:N, Cascade)
         │  │     ├── attendance (1:1, Cascade)
         │  │     └── dailyRecord (1:1, SetNull)
         │  ├── dailyRecords (1:N, Cascade)
         │  ├── mistakeRecords (1:N, Cascade) → KnowledgePoint (N:1, SetNull)
         │  ├── examScores (1:N, Cascade)
         │  ├── learningReports (1:N, Cascade)
         │  ├── achievements (1:N, Cascade)
         │  └── studyEventParticipants (1:N)

TextbookVersion (region+gradeId+subjectId 唯一)
  └── TextbookChapter (textbookVersionId+chapterNo 唯一, 树形 parentChapterId)

KnowledgePoint (自引用树形)

Trial → Student (convertedStudentId, SetNull)

StudyEvent → StudyEventParticipant → Student
```

---

## 八、项目运行方式

### 8.1 npm scripts 清单

| 脚本 | 命令 | 用途 |
|---|---|---|
| `dev` | `next dev` | 开发服务器 |
| `build` | `next build` | 生产构建 |
| `start` | `next start` | 生产启动 |
| `db:generate` | `prisma generate` | 生成 Prisma Client |
| `db:push` | `prisma db push` | 同步 schema 到 DB |
| `db:migrate` | `prisma migrate dev` | 开发迁移 |
| `db:studio` | `prisma studio` | 可视化 DB 管理 |
| `db:seed` | `tsx prisma/seed.ts` | 填充种子数据 |
| `lint` | `next lint` | ESLint |
| **`test`** | **`vitest run`** | **新增：单元测试** |
| **`test:watch`** | **`vitest`** | **新增：单元测试 watch 模式** |
| **`test:coverage`** | **`vitest run --coverage`** | **新增：单元测试覆盖率** |
| `test:e2e` | `playwright test` | E2E 测试 |
| `test:e2e:ui` | `playwright test --ui` | UI 模式测试 |
| `test:e2e:report` | `playwright show-report` | 查看报告 |
| `docker:build` / `up` / `down` / `logs` | docker compose 各操作 | Docker 生命周期 |
| `ci:all` | `lint && tsc --noEmit && prisma generate && build` | CI 一键校验+构建 |
| `cli` | `node cli/shibu.js` | 统一 CLI 入口 |
| `build:exe` | `node scripts/build-exe.js` | 构建 Windows exe |
| `build:electron` | `npx electron-builder --win` | Electron 打包 |
| `postinstall` | `prisma generate \|\| true && node scripts/fix-next-build-traces.js` | 安装后钩子 |

### 8.2 开发模式

```bash
# 方式 1：直接启动
npm run dev

# 方式 2：一键初始化
bash setup.sh dev

# 方式 3：Windows CLI
scripts\shibu-cli.bat dev
```

### 8.3 生产模式（Next.js standalone）

```bash
STANDALONE=true npm run build
npm start
# 或: node cli/shibu.js server
```

### 8.4 Docker 模式

```bash
docker compose build && docker compose up -d
```

- 多阶段构建（deps → builder → runner），基于 `node:20-alpine`
- 数据持久化：volume `shibu-data` 挂载到 `/app/data`
- 健康检查：`curl -f http://localhost:3000/api/health`

### 8.5 Electron 桌面模式

```bash
node cli/shibu.js desktop
```

- 端口：3080，数据目录：`app.getPath("userData")/data/dev.db`
- 窗口：1400×900，系统托盘 + 启动通知

### 8.6 CLI 模式

```bash
node cli/shibu.js <模式>
# 模式: server | cli | desktop | docker | backup | build | build:exe | build:electron
# CLI 子命令: report <姓名> | health | export <类型> | backup | db <action>
```

### 8.7 Runtime 多模态运行器

`runtime/core_app.js` + `runtime/env_detector.js`

**环境自动检测**：electron → exe → docker → dev → server
**数据目录策略**：exe/electron/docker/dev/server 各自隔离
**业务流程模拟**（`runtime/simulate.bat`）：健康检查 → 创建学生 → 排课 → 录入成绩 → 数据验证

### 8.8 Windows .exe 构建（Node.js SEA）

`scripts/build-exe.js` 流程：构建 → 复制资源 → 生成 sea-wrapper.js → Node ≥ 20 用 `--experimental-sea-config` + `postject` 注入 → 失败回退 `pkg` → 再失败创建 `启动拾步.bat`

---

## 九、测试体系

### 9.1 单元测试（Vitest，新增）

**配置**（`vitest.config.ts`）：
- 环境：`node`
- 测试目录：`src/__tests__/**/*.test.ts`
- 路径别名：`@` → `./src`
- 覆盖率：v8 provider，覆盖 `src/app/api/courses/**/*.ts` 和 `src/app/api/mistakes/**/*.ts`

**Mock 策略**（`src/__tests__/helpers/mocks.ts`）：

| Helper | 用途 |
|---|---|
| `createPrismaMock()` | 返回带 course/activityLog/user/$transaction 的 mock 对象 |
| `createSessionMock(overrides)` | 构造 session 对象 |
| `createJsonRequest(body, init)` | 构造 POST Request |
| `createGetRequest(url)` | 构造 GET Request |
| `parseResponse(res)` | 解析 NextResponse.json，返回 `{ status, json }` |

**各测试文件的 mock 模式**：
- `vi.mock("next-auth", ...)` — mock `getServerSession`
- `vi.mock("@/lib/auth", ...)` — mock `authOptions`
- `vi.mock("@/lib/activity-log", ...)` — mock `logActivity`
- `vi.mock("@/lib/prisma", ...)` — 用 `vi.hoisted` 解决 hoisting 问题
- `vi.mock("tesseract.js", ...)` — mock `createWorker` 返回 `{ recognize, terminate }`
- `courses.batch.route.test.ts` 特殊：用 `vi.hoisted` 创建 `txMock`（事务内的 tx 对象）模拟事务

**测试文件覆盖范围**：

| 测试文件 | 覆盖内容 |
|---|---|
| `courses.route.test.ts` | 排课冲突 + 覆盖：未登录 401、无冲突创建 201、有冲突未传 overwrite 返回 409+conflict 详情、endTime 自动计算 |
| `courses.batch.route.test.ts` | 批量排课：未登录 401、缺字段 400、无冲突创建成功、有冲突计入 errors |
| `mistakes.ocr.route.test.ts` | OCR：未登录 401、未提供 image 400、识别成功返回清洗文本、空文本 422、tesseract 抛错 422、jpeg 前缀解码、data URL 前缀剥离 |
| `mistakes.analyze.route.test.ts` | 分析：纯题目 confidence=low、答案标记识别、错误答案识别、**已知 BUG 用例记录源码行为**、searchQuery 不含换行 |

**测试质量亮点**：
- `mistakes.analyze.route.test.ts` 用 `[BUG]` 前缀的测试用例记录源码已知缺陷，不修改源码仅锁定当前行为
- `mistakes.ocr.route.test.ts` 用 1x1 红点 PNG 的 base64 作为测试样本

### 9.2 E2E 测试（Playwright）

**配置**（`playwright.config.ts`）：
- 测试目录：`./e2e`
- **串行执行**（`fullyParallel: false`、`workers: 1`）避免数据冲突
- CI 重试 2 次，本地 0 次
- 浏览器：chromium，locale=zh-CN
- webServer：自动启动 `npm run dev`，复用已有服务

**测试文件清单**（56 个 spec，含 helpers + tdd-red；下表为代表性子集）：

| 编号 | 文件 | 类别 |
|---|---|---|
| 01 | login | 认证 |
| 02 | student | 学生管理 |
| 03 | course | 排课 |
| 04 | record | 学情 |
| 05 | mistake | 错题 |
| 06 | score | 成绩 |
| 07 | business-flow | 全流程冒烟 |
| 08 | diagnostic | 诊断报告 |
| 09-10 | learning-plan / registration / regression | 学习计划/课程包/回归 |
| 11 | weekly | 学员周报 |
| 12 | edit-student | 学生编辑 |
| 13 | reports | 报告 |
| 14 | lesson-plan | AI 学案 |
| 15 | similar | 同类题推荐 |
| 16 | parent-view | 家长端 H5 |
| 17 | finance | 业财看板 |
| 18 | conflict | 排课冲突 |
| 19 | achievement | 竞赛成果 |
| 20 | notifications | 通知 |
| 21 | timeline | 成长时间线 |
| 22 | export | CSV 导出 |
| 23 | confirm | 确认弹窗 |
| 24 | mistakes-print | 错题本打印 |
| 25 | system | 系统 |
| 26 | import | CSV 导入 |
| 27 | studio | 工作室品牌页 |
| 28 | trials | 试听管理 |
| 29 | settings | 系统设置 |
| 30 | revenue | 月度收入 |
| 31 | activity-logs | 操作日志 |
| 32 | review | 错题复习 |
| 33, 40 | batch | 批量操作 |
| 34 | smoke | 冒烟测试 |
| 35 | navsearch | 导航搜索 |
| 36 | skeleton | 骨架屏 |
| 37 | events | 学习活动 |
| 38 | changelog | 更新日志 |
| 39 | global-search | 全局搜索 |
| 41 | calendar | iCal 日历 |
| 42 | onboarding | 新手引导 |
| 43 | semester-report | 学期总结 |
| 44 | breadcrumb | 面包屑 |
| 45 | batch-records | 批量学情 |
| 46 | health | 健康检查 |
| 47 | shortcuts | 快捷键 |
| 48 | about | 关于 |
| 49 | knowledge-points | 知识点 |
| 50 | share-dialog | 分享对话框 |
| 51 | checkin | 签到 |
| 52 | price | 价格 |
| 53 | cli | CLI 测试 |
| 54 | multimodal | 多模态运行 |

### 9.3 helpers.ts 测试工具函数（E2E）

| 函数 | 用途 |
|---|---|
| `login(page)` | 用 `admin@shibu.com` / `shibu123456` 登录 |
| `createTestStudent(page)` | 创建测试学生"张三" |
| `createCourse(page, studentName, subject)` | 明天 15:00 排课 |
| `createDailyRecord(page, studentName, notes)` | 掌握度 4、状态 good |
| `createMistake(page, studentName, subject, content)` | 错因"概念不清" |
| `createScore(page, studentName, examName, score)` | 考试类型 school |
| `selectStudentOption(selectLocator, studentName)` | Locator 过滤 option 文本 |

---

## 十、CI/CD 流程

`.github/workflows/ci.yml` 定义 4 个 job 的串行流水线：

### 10.1 触发条件

- push 到 main / master / develop 分支
- PR 到 main / master
- 手动 workflow_dispatch

### 10.2 流水线

```
┌─────────────────────┐
│ Job 1: lint-and-typecheck │  ubuntu-latest, Node 20
│  npm ci → lint → tsc --noEmit → prisma generate
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Job 2: test-e2e     │  依赖 Job 1
│  启动 postgres:16-alpine service
│  DATABASE_URL=postgresql://shibu:shibu@localhost:5432/shibu_test
│  npm ci → prisma generate → db push → db seed
│  → playwright install chromium → playwright test
│  失败也上传 playwright-report artifact
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Job 3: build        │  依赖 Job 2
│  npm ci → prisma generate → npm run build
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Job 4: docker       │  依赖 Job 3
│  docker build -t shibu-opc-tutor .
│  运行容器 → sleep 5 → curl 健康检查
└─────────────────────┘
```

> **注意**：CI 用 PostgreSQL 测试，但本地和 Docker 用 SQLite，存在数据库引擎不一致风险。CI 未集成 Vitest 单元测试。

---

## 十一、环境变量

| 变量名 | 用途 | 默认值 |
|---|---|---|
| `DATABASE_URL` | 数据库连接 | `file:./dev.db`（SQLite） |
| `NEXTAUTH_SECRET` | NextAuth 加密密钥 | `shibu-dev-secret-change-in-production-2026` |
| `NEXTAUTH_URL` | NextAuth 回调 URL | `http://localhost:3000` |
| `ADMIN_EMAIL` | 种子管理员邮箱 | `admin@shibu.com` |
| `ADMIN_PASSWORD` | 种子管理员密码 | `shibu123456` |
| `STANDALONE` | 启用 Next.js standalone 输出 | 未设置（构建时按需 `=true`） |
| `PORT` | 服务端口 | 3000 |
| `NODE_ENV` | 环境标识 | development / production |
| `NEXT_TELEMETRY_DISABLED` | 禁用 Next.js 遥测 | 1（Dockerfile 中） |
| `DOCKER_CONTAINER` | Docker 检测标记 | env_detector.js 检测 `true` |
| `HOSTNAME` | standalone 服务监听地址 | `0.0.0.0`（Dockerfile 中） |

> **安全警告**：`.env` 中默认管理员密码和 NEXTAUTH_SECRET 已提交到仓库，生产必须替换。

---

## 十二、架构特征与技术债务

### 12.1 设计亮点

1. **主数据底座设计**：School/Grade/Subject/TextbookVersion/TextbookChapter 五张主数据表，支撑"选学校→自动出年级→自动出全科教材版本"联动，替代原文本字段
2. **学校列表分组排序**：高中按 isKey DESC + keyLevel ASC 排序（重点校优先），非高中按 town ASC 排序
3. **学校与年级柔性关联**：Grade.schoolTypes 字段反向声明适用学段，避免硬编码联动
4. **教材版本唯一约束**：region+gradeId+subjectId 三元组唯一，避免重复
5. **章节树形结构**：TextbookChapter 支持 parentChapterId 多级嵌套，`buildChapterTree` 用 Map 组装
6. **课程签到的事务设计**：使用 `updateMany` 的 WHERE 条件实现原子性检测，防止并发重复扣课
7. **排课冲突检测 + 覆盖模式**：返回完整 conflict 对象供前端确认
8. **批量操作的错误隔离**：单个失败不影响其他，返回详细 errors 数组
9. **时间线聚合**：9 个数据源并行查询，统一事件 schema
10. **周报自然语言生成**：基于数据动态拼接中文总结
11. **分享 token 设计**：无状态 token 嵌入时间戳，无需服务端存储
12. **错题 OCR 本地识别**：tesseract.js chi_sim+eng，无需外部 API
13. **错题分析纯规则匹配**：无外部 AI 依赖，后续可扩展接入 AI API
14. **多模态运行器**：自动检测 electron/exe/docker/dev/server 五种环境
15. **Vitest 单元测试体系**：vi.hoisted 解决 mock hoisting，`[BUG]` 测试用例记录已知缺陷
16. **纯 SVG 图表**：ScoreChart 零依赖实现成绩趋势可视化，培训学科高亮

### 12.2 共性技术模式

| 模式 | 实现 |
|---|---|
| 认证 | `getServerSession(authOptions)` + `if (!session) return 401` |
| 响应格式 | `NextResponse.json({ data, total })` 或 `{ error, message }` |
| 错误处理 | `try/catch` + `console.error` + 400 响应 |
| 操作日志 | `logActivity({ action, entity, summary, userId })` |
| 查询过滤 | `searchParams.get()` + `where: any` 动态构建 |
| 并行查询 | 聚合路由普遍使用 `Promise.all` |
| 分页 | 仅 records 和 activity-logs 实现真正分页 |
| 事务 | 课程签到/批量排课/批量成绩录入使用 `prisma.$transaction` |
| 字段白名单 | students/records/master-data PUT 防数据注入 |
| 主数据联动 | school.level → Grade.schoolTypes contains 过滤 |
| 校验抽取 | score-validation / training-subject-validation 独立工具库 |

### 12.3 技术债务

1. **`api-response.ts` 形同虚设**：定义了完整 helper 但几乎无人使用
2. **`any` 类型泛滥**：`mistakes/ocr/route.ts` 第 57 行 `catch (err: any)` 违反 user_rules 禁用 any 规则
3. **认证代码重复**：每个路由重复 `getServerSession` + `if (!session)` 检查
4. **无角色鉴权**：token 携带 `role` 但所有路由只检查 `if (!session)`
5. **分页不统一**：仅 records 和 activity-logs 有真正分页
6. **日志覆盖不全**：学习计划、知识点、注册更新等写操作未调用 `logActivity`
7. **JSON 字段以字符串存储**：`knowledgePoints` / `scoreTrend` / `mistakeAnalysis` / `examRange` 等用 `JSON.stringify` 存为 String
8. **硬编码品牌信息**：`studio` 和 `settings` 路由硬编码"拾步工作室"
9. **share token 安全性较弱**：仅 base64 编码，无签名
10. **数据库引擎不一致**：本地 SQLite / CI PostgreSQL / schema 用 sqlite provider
11. **LessonPlan.studentId 无外键约束**：声明字段但未建立 @relation
12. **ActivityLog.userId 无外键约束**：纯文本记录
13. **CLI 脚本依赖未声明**：electron / electron-builder / postject / pkg 未在 package.json 声明
14. **客户端组件主导**：未充分利用 Server Components 的流式渲染与数据预取优势
15. **无数据获取库**：无 SWR / React Query，无缓存、无重试、无后台重验证
16. **路由守卫在客户端**：存在 loading 闪烁，建议加 middleware 边缘拦截
17. **StudentSubjectRecord 无 subject 关系字段**：需调用方单独查询 Subject 表后内存合并 subjectName
18. **错题分析正则 BUG**：`/答案[：:]\s*(.+)/` 未锚定行首，"错误答案：5" 会被错误匹配为 correctAnswer（已用 `[BUG]` 测试用例记录）
19. **seed 与前端常量不一致**：seed 中出现 `complete_sec`（完全中学）学段，但前端 `SCHOOL_LEVELS` 常量只有 primary/junior/senior/nine_year 四类
20. **CI 未集成单元测试**：Vitest 单元测试未纳入 CI 流水线

---

## 附录：关键交互流程

### A.1 登录流程

1. 访问任意 `/dashboard/*` → `useSession()` 返回 `unauthenticated` → `redirect("/login")`
2. 登录页预填 `admin@shibu.com / shibu123456`，点击登录 → `signIn("credentials", { redirect: false })`
3. 成功后 `router.push("/dashboard")`

### A.2 学生建档（主数据联动，新增）

1. `/dashboard/students/new` 选择学校 → `SchoolSelector` 300ms 防抖搜索
2. 选中学校后 → `GradeSelector` 自动拉取 `/api/master-data/schools/[id]/grades` 联动年级
3. 选完年级 → `SubjectTextbookCard` 按 region+gradeId 拉取全科 + 教材版本
4. 录入初始成绩 → `ScoreFormModal` 含考试范围章节树选择器
5. 标记培训学科 → `TrainingSubjectSection` 多选

### A.3 排课签到 → 学情跳转

1. `/dashboard/courses` 周视图选中课程 → "批量签到" → `POST /api/courses/checkin`
2. 签到成功后提供"去记录学情"快捷跳转 → `/dashboard/records?studentId=xxx&courseId=xxx`

### A.4 错题 OCR 录入（新增）

1. `/dashboard/mistakes` 点击"拍照录入" → `CameraCapture` 拍照
2. 图片 base64 → `POST /api/mistakes/ocr` → tesseract.js 识别返回 rawText
3. rawText → `POST /api/mistakes/analyze` → 正则匹配题目/答案/搜索关键词
4. 用户确认后 → `POST /api/mistakes` 创建错题记录

### A.5 错题复习 Flashcard

1. `/dashboard/review` 选择学生 + 错因筛选
2. `fetch /api/mistakes?limit=200` 拉取非 mastered 错题
3. 逐题展示：题目 + 错误答案 → "查看答案" → 正确答案 + 已做对次数
4. "做对了" / "还需要巩固" → `POST /api/mistakes/{id}/similar`
5. 连续做对 3 道 → 后端自动将错题状态升级为 `mastered`

### A.6 双轨制学习计划

1. `/dashboard/students/[id]/learning-plan` 展示 `schoolRatio` + `examRatio` 双滑块
2. 滑块联动约束：`schoolRatio + examRatio === 100`

### A.7 排课冲突覆盖

1. 批量排课提交 → 后端检测时间冲突返回 409 + 冲突详情
2. 前端弹出 `ConfirmDialog`（variant: warning）
3. "覆盖" → 重新 POST 携带 `force: true`

### A.8 家长分享流程

1. 学生详情页"生成分享链接" → `POST /api/share` 创建 token
2. 复制链接 `https://xxx/parent/{token}` 发给家长
3. 家长打开 H5 页面 → `fetch /api/share?token=xxx` 验证

### A.9 全局搜索

1. 任意 dashboard 页面按 `⌘⇧F`
2. `GlobalSearch` 弹出居中浮层，300ms 防抖后 `fetch /api/search?q=xxx`
3. 5 类结果分 section 展示

### A.10 同类题举一反三

1. `/dashboard/mistakes` 列表中每条错题下方"举一反三"按钮
2. `GET /api/mistakes/{id}/similar` 获取 3 道同类题
3. 连续做对 3 道 → 后端自动将错题状态升级为 `mastered`

### A.11 主数据维护（新增）

1. `/dashboard/master-data` 5 Tab 切换
2. 学校 Tab：搜索 + 镇街筛选 + CSV 导入（隐藏 file input + ref）
3. 章节 Tab：地区+年级+学科 → 教材版本 → 章节树（递归渲染，默认展开有子节点的章节）
4. 章节 CSV 导入：`textbookVersionId/chapterNo/chapterName/parentChapterNo/order`，parentChapterNo 匹配 chapterNo

---

> 本 Code Wiki 基于项目源码静态分析生成，覆盖 63 API 路由、37 前端页面、25 组件、7 工具库、28 数据模型、56 E2E 测试、4 单元测试、6 种运行方式、CI/CD 流程的完整文档。最近更新反映"主数据底座改造"迭代的全部变更。
