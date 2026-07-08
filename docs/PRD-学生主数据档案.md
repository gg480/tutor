# PRD：学生基础档案主数据底座改造

## 1. 项目背景（Problem Statement）

当前 `shibu/prisma/schema.prisma` 的 Student 模型存在三个核心问题：
- `school`、`textbook` 是**纯文本字段**，无法做关联查询和数据校验
- `grade`、学科列表**前端硬编码**，无法支撑"9年一贯制学校可选小学初中年级"这类联动
- **没有任何主数据表**（School/Grade/Subject/Textbook），所有业务表（Course/MistakeRecord/ExamScore）的 subject 字段各自为政，无法支撑"全科成绩监控+基础学情分析"

用户诉求：把学生档案改造成**主数据底座式**，让学校/年级/学科/教材版本/竞赛成为可关联的主数据，后续所有业务（排课、错题、成绩、学习计划）都基于这个底座。

## 2. 目标用户与场景

| 用户 | 场景 |
|------|------|
| 工作室老师 | 新生建档：选学校→自动出年级→自动出全科教材版本和考试标记→录入初始成绩 |
| 工作室老师 | 学情分析：查看学生全科成绩曲线，判断薄弱学科 |
| 工作室老师 | 排课关联：在学生档案标记培训学科，关联日程表看上课后成绩变化 |
| 管理员 | 维护主数据：学校名单、教材版本、竞赛大纲 |

## 3. 主数据模型设计（新增5张表）

### 3.1 School（学校主数据）
```prisma
model School {
  id          String  @id @default(cuid())
  name        String  // 学校全称
  district    String  // 区：南海区/禅城区/顺德区/三水区/高明区
  town        String? // 镇街：桂城/大沥/狮山/里水/九江/西樵/丹灶（高中可为空）
  level       String  // primary|junior|senior|nine_year|complete_sec
  isKey       Boolean @default(false)  // 重点标记（高中用）
  keyLevel    String? // 省一级/市一级/区一级（可选）
  address     String?
  source      String  @default("manual") // manual|web_search|gov_data 数据来源
  verified    Boolean @default(false)    // 是否人工点选确认
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3.2 Grade（年级主数据）
```prisma
model Grade {
  id           String  @id @default(cuid())
  name         String  // 小四/小五/.../高三
  level        String  // primary|junior|senior
  order        Int     // 排序：小四=4,小五=5,...,高三=12
  schoolTypes  String  // 适用的学校level，逗号分隔：primary,junior|nine_year
}
```

### 3.3 Subject（学科主数据）
```prisma
model Subject {
  id              String  @id @default(cuid())
  name            String  // 语文/数学/英语/物理/化学/生物/政治/历史/地理/信息
  category        String  // basic|competition|qiangji  基础学科/竞赛/强基
  examTypes       String  // 逗号分隔：mid_term,final,zhongkao,gaokao,aoshu,qiangji
  applicableLevels String // 适用的学段：primary,junior,senior
  isCompetition   Boolean @default(false)
}
```

### 3.4 TextbookVersion（教材版本主数据）— 按"地区+年级+学科"配置
```prisma
model TextbookVersion {
  id         String  @id @default(cuid())
  region     String  // 地区：南海区/禅城区...（默认南海区）
  gradeId    String
  subjectId  String
  version    String  // 人教版/北师大版/苏教版/粤教版等
  publisher  String? // 出版社
  // 唯一约束：region+gradeId+subjectId
}
```

### 3.5 CompetitionSyllabus（竞赛教材大纲）— 用户选了"完整大纲"档
```prisma
model CompetitionSyllabus {
  id              String  @id @default(cuid())
  subjectId       String  // 学科
  competitionType String  // aoshu|physics_olympiad|qiangji_math...
  textbookName    String  // 如《奥数教程》《强基计划数学教程》
  textbookVersion String? // 版本/出版社
  outline         String  // 完整大纲JSON（章节+知识点）
  difficulty      String  // 基础/提高/竞赛
  source          String  // 数据来源
}
```

### 3.6 TextbookChapter（教材章节主数据）— 支撑"考试范围按章节选择"
```prisma
model TextbookChapter {
  id                String  @id @default(cuid())
  textbookVersionId String  // 关联 TextbookVersion（地区+年级+学科）
  chapterNo         String  // 章节号：1, 2, 1.1
  chapterName       String  // 章节名：如"有理数"、"二次函数"
  parentChapterId   String? // 父章节，支持多级（章→节）
  order             Int     // 排序
  // 唯一约束：textbookVersionId + chapterNo
}
```
> 说明：教材章节与教材版本绑定，每个 TextbookVersion（地区+年级+学科）下维护一棵章节树。录入成绩选范围时，按学生的 gradeId+subjectId 定位到对应 TextbookVersion，再展示其章节树供多选。

## 4. Student 模型改造

```prisma
model Student {
  // 保留：name, parentGoal, studentGoal, currentScore, personality,
  //       weakness, summary, parentName, parentPhone, parentWechat, status
  // ↓ 改造字段
  schoolId    String?   // 替代原 school 文本字段
  gradeId     String    // 替代原 grade 字段，外键关联 Grade
  // ↓ 废弃字段（无历史数据，可直接删除）
  // school     String?
  // grade      String
  // textbook   String?
  // ↓ 新增关联
  subjectRecords     StudentSubjectRecord[]
  trainingSubjects   StudentTrainingSubject[]
}

// 学生全科成绩记录（基础学情分析数据源）
model StudentSubjectRecord {
  id          String   @id @default(cuid())
  studentId   String
  subjectId   String
  score       Float    // 分数
  fullScore   Float    // 满分
  rank        String?  // 排名/等级
  examType    String   // 考试类型，枚举见下方说明
  examDate    DateTime
  examName    String   // 考试名称（必填，如"南海区2026年1月期末统考"）
  examRange   String?  // 考试范围：JSON 数组，存 TextbookChapter.id 列表
  note        String?
  createdAt   DateTime @default(now())
}
```

**examType 枚举说明**：
| 值 | 含义 | 备注 |
|----|------|------|
| `weekly` | 周测 | 高频小范围 |
| `quiz` | 测验 | 课堂随堂测验 |
| `monthly` | 月考 | 月度考试 |
| `mid_term` | 期中考 | 半学期 |
| `final` | 期末考 | 学期末，南海区统考为主 |
| `mock` | 模拟考 | 中考/高考模拟 |
| `zhongkao` | 中考 | 仅初三 |
| `gaokao` | 高考 | 仅高三 |
| `competition` | 竞赛 | 奥赛/强基考试 |

> examType 选择会影响"考试范围"是否必填：周测/测验/月考/期中必填范围（按章节多选）；期末/模拟/中考/高考可不填（默认全册）。

```prisma
// 学生培训学科（标记在工作室上课的学科）
model StudentTrainingSubject {
  id          String   @id @default(cuid())
  studentId   String
  subjectId   String
  isAtStudio  Boolean  @default(true) // 是否在工作室上课
  startDate   DateTime
  endDate     DateTime?// 结课日期
  status      String   @default("active") // active|paused|ended
  // 关联课程：通过 Course.studentId + Course.subjectId 软关联
}
```

## 5. 功能列表（P0/P1/P2）

| 优先级 | 功能 | 描述 | 验收标准 |
|--------|------|------|---------|
| **P0** | 学校选择器 | 检索式下拉，输入"石门"能搜出石门中学/石门实验/石门狮山等 | Given 输入"石门" When 搜索 Then 返回所有含"石门"的学校；小学初中按镇排序，高中按重点排序 |
| **P0** | 年级联动选择 | 选完学校自动过滤可选年级 | Given 选了九年一贯制学校 When 选年级 Then 出现小四~初三；Given 选了普通小学 Then 只出现小四~小六 |
| **P0** | 主数据管理后台 | School/Grade/Subject/TextbookVersion 的 CRUD | 管理员能新增/编辑/导入学校名单；CSV 批量导入南海区学校 |
| **P0** | 学生档案表单改造 | new/edit 页面用主数据选择器替代文本框 | 选完学校+年级后，自动展示该年级全科+教材版本+考试标记 |
| **P0** | 全科学科展示 | 按年级自动列出全科，标记考试属性 | Given 南海区初一 When 展示学科 Then 显示"数学(中考/期末考)、语文(中考/期末考)、英语(中考/期末考)、政治(中考)、历史(中考)、地理(期末考)、生物(期末考)"等 |
| **P0** | 教材章节维护 | TextbookChapter 的 CRUD + 树形展示 | 管理员能为每个 TextbookVersion 维护章/节树；支持 CSV 批量导入章节 |
| **P1** | 全科成绩录入 | 学生详情页新增"成绩记录"tab | 必填考试名称；考试类型下拉（周测/测验/月考/期中/期末/模拟/中考/高考/竞赛）；选周测/测验/月考/期中时必填考试范围（按教材章节多选）；支持批量录入 |
| **P1** | 培训学科标记 | 在学生档案标记在工作室上课的学科 | 能多选培训学科，标记是否在工作室上课，记录开始日期 |
| **P1** | 成绩曲线可视化 | 基于StudentSubjectRecord的时间序列折线图 | Given 学生有3次以上数学成绩 When 查看曲线 Then 显示数学成绩趋势线，培训学科高亮 |
| **P1** | 日程关联展示 | 培训学科关联Course表，展示上课记录 | Given 学生数学在工作室上课 When 查看日程 Then 显示该生所有数学课程的日期和内容 |
| **P2** | 竞赛教材大纲库 | CompetitionSyllabus 的 CRUD + 关联展示 | 学生档案可查看该年级可参加的竞赛学科+教材+大纲 |
| **P2** | 学校数据网络搜索 | 前端"搜索不到？帮我找"按钮触发后端网络搜索 | Given 输入校名搜不到 When 点"帮我找" Then 调WebSearch返回候选，用户点选确认入库 |
| **P2** | 基础学情分析报告 | 基于全科成绩自动生成学情分析 | Given 学生有5科以上成绩 When 生成报告 Then 输出薄弱学科、优势学科、培训学科进步情况 |

## 6. 学校数据源策略（用户已选"开放数据源+网络搜索+人工点选确认"）

```
首批数据（CSV批量导入）
  ↓ 来源1：南海区教育局门户公开名单
  ↓ 来源2：今日头条/网易等公开报道（如"2025佛山初中大盘点"）
  ↓ 来源3：维基百科佛山学校列表
  ↓ 来源4：高德/百度地图POI搜索（按"南海区 学校"关键词）
  → 人工整理成 CSV → 批量导入 School 表 → verified=true

日常维护（建档时发现新学校）
  ↓ 用户在学校选择器输入校名
  ↓ 前端模糊查询本地 School 表
  ↓ 若无匹配 → 显示"帮我找"按钮
  ↓ 后端调 WebSearch + 高德POI → 返回候选列表
  ↓ 用户点选确认 → 写入 School 表，source="web_search", verified=true
```

**首批覆盖范围**：南海区7镇街（桂城/大沥/狮山/里水/九江/西樵/丹灶）的小学+初中+高中，预计约200所学校。

## 7. 非功能需求

- **性能**：学校选择器搜索响应 < 200ms（本地查询）；网络搜索"帮我找"< 5s
- **数据一致性**：教材版本按"地区+年级+学科"唯一约束，避免重复
- **可扩展**：主数据表预留 region/district 字段，未来可扩展到佛山其他区
- **兼容性**：保留现有 Course/MistakeRecord/ExamScore 的 subject 字符串字段，新增 subjectId 外键，双轨过渡

## 8. 约束条件

- **技术栈**：Next.js + Prisma + SQLite（现有），不切换
- **数据规模**：单工作室，学生数 < 500，学校数 < 300，无需分库分表
- **竞赛大纲工作量**：奥赛5科（数/物/化/生/信）+ 强基（数/物/化/生/史/哲/汉语言/基础医学）的教材+完整大纲，需分批建设，单次PRD不要求一次性产出全部

## 9. Non-Goals（明确不做）

- ❌ 不做学校数据的实时政府API对接（佛山教育局未开放结构化API）
- ❌ 不做全国学校库（仅覆盖佛山南海区，按需扩展）
- ❌ 不做竞赛大纲的自动抓取（涉及版权，人工整理为主）
- ❌ 不重写现有 Course/MistakeRecord/ExamScore 表结构（仅新增外键关联）
- ❌ 不做学生家长端档案查看（本期只做工作室老师端）

## 10. 实施风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 南海区学校名单分散在网络各处，整理耗时 | P0 阻塞 | 先覆盖桂城+狮山（学校最多），其他镇街按需补 |
| 竞赛大纲完整维护工作量巨大 | P2 难以收口 | 分学科迭代，先做数学奥赛+强基数学，其他按需 |
| 教材版本按"地区+年级+学科"配置，配置项多（9年级×10学科=90条/地区） | P0 数据准备 | 写种子脚本批量初始化南海区默认配置 |

## 11. 实施路径建议

1. **Sprint 1（P0）**：主数据表建表 + 种子数据（南海区学校+年级+学科+教材版本）+ 学校选择器+年级联动+学生档案表单改造
2. **Sprint 2（P1）**：全科成绩录入+培训学科标记+成绩曲线+日程关联
3. **Sprint 3（P2）**：竞赛大纲库（先数学奥赛+强基数学）+ 学校网络搜索+学情分析报告
