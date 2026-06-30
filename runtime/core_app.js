#!/usr/bin/env node
// ============================================
// 多模态核心启动器
// 统一入口: 适配所有运行模式
// ============================================
"use strict";

const { detectRuntimeMode, getDataDir, ensureDataDir, getRuntimeInfo } = require("./env_detector");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const ROOT = process.cwd();
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

function log(msg) {
  const time = new Date().toLocaleTimeString("zh-CN");
  console.log(`[${time}] [core] ${msg}`);
}

async function startServer() {
  const mode = detectRuntimeMode();
  const dataDir = ensureDataDir();

  log(`运行模式: ${mode}`);
  log(`数据目录: ${dataDir}`);
  log(`工作目录: ${ROOT}`);
  log(`平台: ${process.platform} ${process.arch}`);

  // 设置环境
  process.env.DATABASE_URL = `file:${path.join(dataDir, "dev.db")}`;
  process.env.NEXTAUTH_URL = SERVER_URL;
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || `shibu-${mode}-${Date.now()}`;

  // 选择启动方式
  const standalonePath = path.join(ROOT, ".next", "standalone", "server.js");
  const useStandalone = fs.existsSync(standalonePath);

  let serverCmd, serverArgs;
  if (useStandalone) {
    serverCmd = process.execPath;
    serverArgs = [standalonePath];
    log(`启动: standalone 模式`);
  } else {
    serverCmd = "npx";
    serverArgs = ["next", "start", "-p", String(PORT)];
    log(`启动: next start 模式`);
  }

  // 启动服务
  const child = spawn(serverCmd, serverArgs, {
    env: { ...process.env },
    stdio: "pipe",
    cwd: ROOT,
    shell: true,
  });

  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => process.stderr.write(d));

  // 等待服务就绪
  await waitForServer();

  // 自动打开浏览器
  openBrowser(SERVER_URL);

  log(`✅ 服务已就绪: ${SERVER_URL}`);
  log(`   模式: ${mode}`);
  log(`   管理员: admin@shibu.com`);

  return child;
}

function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get(`${SERVER_URL}/api/health`, (res) => {
        let data = "";
        res.on("data", (c) => data += c);
        res.on("end", () => {
          try {
            const j = JSON.parse(data);
            if (j.status === "healthy" || j.checks) return resolve();
          } catch (_) {}
          if (n > 0) setTimeout(() => check(n - 1), 1000);
          else reject(new Error("超时"));
        });
      }).on("error", () => {
        if (n > 0) setTimeout(() => check(n - 1), 1000);
        else reject(new Error("超时"));
      });
    };
    check(retries);
  });
}

function openBrowser(url) {
  try {
    const platform = process.platform;
    if (platform === "win32") {
      require("child_process").execSync(`start ${url}`, { shell: true });
    } else if (platform === "darwin") {
      require("child_process").execSync(`open ${url}`);
    } else {
      require("child_process").execSync(`xdg-open ${url} || true`);
    }
  } catch (_) {}
}

// ============================================
// CLI 模式: 直接执行命令
// ============================================
async function runCommand(args) {
  const cmd = args[0] || "help";

  switch (cmd) {
    case "env":
      console.log(JSON.stringify(getRuntimeInfo(), null, 2));
      break;

    case "health":
      try {
        const res = await fetch(`${SERVER_URL}/api/health`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log(`服务未运行: ${e.message}`);
      }
      break;

    case "report": {
      const studentName = args.slice(1).join(" ");
      if (!studentName) return console.log("用法: core report <学生姓名>");
      try {
        const res = await fetch(`${SERVER_URL}/api/students?q=${encodeURIComponent(studentName)}`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log(`错误: ${e.message}`);
      }
      break;
    }

    case "simulate": {
      const scenario = args[1] || "basic";
      await simulateScenario(scenario, args.slice(2));
      break;
    }

    default:
      console.log(`
用法: node runtime/core_app.js <命令>

命令:
  server         启动服务（默认）
  env            显示运行环境信息
  health         健康检查
  report <姓名>  查询学生
  simulate <场景> 运行模拟场景

模拟场景:
  simulate basic         基础流程模拟
  simulate full          完整业务流程
  simulate load          负载测试模拟
  simulate error         错误场景模拟

运行模式自动检测: exe / docker / electron / dev / server
      `);
  }
}

// ============================================
// 模拟场景
// ============================================
async function simulateScenario(scenario, args) {
  const BASE = SERVER_URL;
  const log = (s) => console.log(`[simulate] ${s}`);

  log(`开始模拟场景: ${scenario}`);
  log(`目标服务: ${BASE}`);

  try {
    // 1. 健康检查
    log("1/5 健康检查...");
    const health = await fetch(`${BASE}/api/health`);
    const healthData = await health.json();
    log(`   状态: ${healthData.status}`);

    // 2. 创建学生
    log("2/5 创建学生...");
    const student = await fetch(`${BASE}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `模拟学生_${Date.now()}`,
        grade: "初一",
        school: "模拟中学",
        parentGoal: "成绩提升",
        weakness: "函数薄弱",
      }),
    });
    const studentData = await student.json();
    log(`   学生ID: ${studentData.data?.id || "N/A"}`);

    // 3. 排课
    log("3/5 创建课程...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const course = await fetch(`${BASE}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: studentData.data?.id,
        subject: "数学",
        startTime: tomorrow.toISOString(),
        duration: 120,
      }),
    });
    const courseData = await course.json();
    log(`   课程ID: ${courseData.data?.id || "N/A"}`);

    // 4. 录入成绩
    log("4/5 录入成绩...");
    await fetch(`${BASE}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: studentData.data?.id,
        examName: "模拟考试",
        subject: "数学",
        score: 85,
        totalScore: 100,
      }),
    });

    // 5. 验证
    log("5/5 数据验证...");
    const students = await fetch(`${BASE}/api/students`);
    const studentsData = await students.json();
    log(`   学生总数: ${studentsData.total || studentsData.data?.length || 0}`);

    log("✅ 模拟完成!");
  } catch (err) {
    log(`❌ 模拟失败: ${err.message}`);
  }
}

// ============================================
// 主入口
// ============================================
async function main() {
  const args = process.argv.slice(2);
  const mode = detectRuntimeMode();

  if (args.length === 0 || args[0] === "server") {
    const child = await startServer();
    process.on("SIGINT", () => { log("关闭中..."); child.kill(); process.exit(0); });
    process.on("SIGTERM", () => { child.kill(); process.exit(0); });
  } else {
    await runCommand(args);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[core] 错误: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { startServer, runCommand, detectRuntimeMode, getRuntimeInfo };
