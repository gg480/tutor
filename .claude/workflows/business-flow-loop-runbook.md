# 业务流循环测试-修复 Runbook

> 每轮执行 SOP（第N轮/40，累计40轮自动停止）

## 角色与目标
你是拾步家教工作室项目（`d:\02工作\家教工作室\shibu`）的业务流循环测试-修复执行者。本轮是累计40轮中的第N轮（N由状态文件决定）。

## 执行逻辑
完整逻辑参考 `.claude/workflows/business-flow-loop.js`（先读取它理解9步流程），这里是要点：

### 步骤1 读取状态
读取 `d:\02工作\家教工作室\shibu\.claude\business-flow-loop-state.json`。
- 若 `status != "active"` 或 `completedRounds >= 40`：直接结束，报告"已完成或已暂停，本轮跳过"
- 否则继续

### 步骤2 选择业务流（失败优先）
- 若 `failedQueue` 非空：取队首(shift)作为本轮目标，这是重试场景
- 否则：按 `currentPointer` 从 `d:\02工作\家教工作室\shibu\.claude\business-flows-index.json` 的 flows 数组取一条（pointer到50回绕）

### 步骤3 理解业务目标
从 `d:\02工作\家教工作室\shibu\CODE-WIKI.md` 读取该业务流的 `wikiSection`（如 A.2 / 4.1.2）附近内容，理解 `businessGoal`。

### 步骤4 生成 playwright 业务模拟脚本
确保目录 `d:\02工作\家教工作室\shibu\e2e\_business-flow-tmp\` 存在。在该目录生成本轮临时脚本，文件名 `bf-{flowId}-round-{N}.spec.ts`。
脚本要求：
- 用 `@playwright/test`，复用 `e2e/helpers.ts` 的 login 等工具（`import { login } from '../helpers'`）
- 按 CODE-WIKI 描述模拟真实用户业务操作（登录→进页面→填表→提交→验证结果）
- 评估 `businessGoal` 能否达成，不是简单断言，而是模拟真实业务运作
- 脚本要能独立运行：`npx playwright test e2e/_business-flow-tmp/bf-xxx.spec.ts`

### 步骤5 运行评估
在 `d:\02工作\家教工作室\shibu` 目录执行：`npx playwright test e2e/_business-flow-tmp/bf-{flowId}-round-{N}.spec.ts --reporter=list`
捕获完整输出。dev server 会由 `playwright.config.ts` 的 webServer 自动启动（如未运行）。
判断通过：无 failing、有 passed 即通过。

### 步骤6 不通过则修复（通过则跳到步骤7）
分析失败原因：
- 优先修 `src/` 下的业务代码（API route / 页面 page.tsx / 组件），遵循用户规则：函数不超50行、async要有try/catch、禁止any、不留TODO
- 只有当测试脚本本身有明显错误（如选择器写错）时才修临时脚本
修复后重测（最多重测2次）：
- 重测通过：`result = passAfterFix`
- 2次重测仍不过：`result = stillFailing`，将该 flowId 加入 failedQueue 尾部（若是重试场景则重新放回队尾）

### 步骤7 更新状态文件
写回 `d:\02工作\家教工作室\shibu\.claude\business-flow-loop-state.json`：
- `completedRounds` +1
- `currentPointer`：仅当本轮是新流程（非重试）时才 +1（到50回绕）
- `failedQueue`：按步骤6规则维护
- `lastRunAt` = 当前 ISO 时间
- `stats`：passOnFirstTry / passAfterFix / stillFailing / totalFixes 按结果更新
- `history` 数组追加：`{ round: N, flowId, flowName, result, fixFiles: [...], timestamp }`
- 若 `completedRounds >= 40`：`status` 改为 `"completed"`

### 步骤8 版本管理（有修复时）
若步骤6改了 src/ 文件：
- 在 `d:\02工作\家教工作室\shibu` 执行：`git add src/ .claude/business-flow-loop-state.json e2e/_business-flow-tmp/`
- `git commit -m "fix(bf-{flowId}): {flowName} round {N}/40 {result}"`
- `git push origin master`（失败不中断，记录警告）
即使无修复，也要 `git add .claude/business-flow-loop-state.json e2e/_business-flow-tmp/` 并 commit -m "chore(bf-{flowId}): round {N}/40 {result}" 推送，保留本轮记录。

## 完成判定
- 单轮完成即结束本轮会话，等待下次触发
- 累计40轮后 status=completed，后续触发自动跳过

## 健壮性要求
- 任何步骤失败都要 catch，更新 state 为合理状态（result=error 记入 history），不能让定时任务卡死
- 若 playwright 环境异常（如 server 启动失败），记录错误并结束本轮
- 不要修改 CODE-WIKI.md、business-flows-index.json 本身

## 本轮汇报
执行完成后，用一句话汇报：第N轮/40 业务流{flowId}-{flowName} 结果{result} 修复文件数{X}

---

## 手动触发方式

### 方式1：定时任务（推荐）
用 Schedule 工具创建：cron `*/10 * * * *`，timezone `Asia/Shanghai`，message 引用本 runbook。

### 方式2：当前会话手动派发 subagent
用 Task 工具（subagent_type: general_purpose_task），query 传本 runbook 内容 + "本轮是第N轮"。

### 方式3：查看进度
读取 `.claude/business-flow-loop-state.json` 查看 completedRounds / currentPointer / failedQueue / stats / history。
