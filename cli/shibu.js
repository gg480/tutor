#!/usr/bin/env node
// ============================================
// 拾步 OPC Tutor Suite — CLI 入口
// 多种运行模式: server | cli | desktop | docker | backup
// ============================================

const { spawn, execSync } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

const MODE = process.argv[2] || "server";
const SUB_COMMAND = process.argv.slice(3).join(" ");

// ---- 彩色输出 ----
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

// ============================================
// 模式1: server — 启动 Web 服务
// ============================================
async function serverMode() {
  console.log(colors.blue("🚀 拾步 OPC Tutor Suite — 服务模式"));
  console.log(colors.bold(`   地址: ${SERVER_URL}`));

  const env = {
    ...process.env,
    PORT: String(PORT),
    NEXTAUTH_URL: SERVER_URL,
  };

  // 检查是否已构建
  const standalonePath = path.join(ROOT, ".next", "standalone", "server.js");
  const useStandalone = fs.existsSync(standalonePath);

  const cmd = useStandalone ? "node" : "npx";
  const args = useStandalone
    ? [standalonePath]
    : ["next", "start", "-p", String(PORT)];

  console.log(colors.blue(`   模式: ${useStandalone ? "standalone" : "dev"}`));

  const child = spawn(cmd, args, { env, stdio: "inherit", cwd: ROOT, shell: true });

  // 自动打开浏览器
  setTimeout(() => {
    try {
      const platform = process.platform;
      if (platform === "win32") {
        execSync(`start ${SERVER_URL}`, { shell: true });
      } else if (platform === "darwin") {
        execSync(`open ${SERVER_URL}`);
      } else {
        execSync(`xdg-open ${SERVER_URL} || sensible-browser ${SERVER_URL} || true`);
      }
    } catch (e) { /* 忽略 */ }
  }, 3000);

  process.on("SIGINT", () => { child.kill(); process.exit(0); });
  process.on("SIGTERM", () => { child.kill(); process.exit(0); });
  child.on("exit", (code) => process.exit(code));
}

// ============================================
// 模式2: cli — 命令行模式
// ============================================
async function cliMode() {
  const args = process.argv.slice(3);
  const command = args[0] || "help";

  console.log(colors.blue(`🔧 拾步 CLI — ${command}`));

  switch (command) {
    case "report":
      // 生成学生报告
      const studentName = args.slice(1).join(" ");
      if (!studentName) {
        console.log(colors.red("请指定学生姓名: shibu cli report <姓名>"));
        return;
      }
      try {
        // 先确保服务在运行
        const res = await fetch(`${SERVER_URL}/api/students?q=${encodeURIComponent(studentName)}`);
        const data = await res.json();
        console.log(colors.green(`📊 学生: ${studentName}`));
        console.log(JSON.stringify(data.data || [], null, 2));
      } catch (err) {
        console.log(colors.red(`错误: ${err.message}`));
        console.log(colors.yellow("请先启动服务: shibu server"));
      }
      break;

    case "health":
      // 健康检查
      fetch(`${SERVER_URL}/api/health`)
        .then((r) => r.json())
        .then((d) => console.log(JSON.stringify(d, null, 2)))
        .catch((e) => console.log(colors.red(`服务未运行: ${e.message}`)));
      break;

    case "export":
      // 导出数据
      const type = args[1] || "students";
      console.log(colors.blue(`导出: ${type}`));
      const url = `${SERVER_URL}/api/export?type=${type}`;
      console.log(`GET ${url}`);
      break;

    case "backup":
      // 备份数据库
      backupMode();
      break;

    case "db":
      // 数据库操作
      const dbAction = args[1] || "push";
      execSync(`npx prisma ${dbAction}`, { cwd: ROOT, stdio: "inherit" });
      break;

    default:
      showHelp();
  }
}

// ============================================
// 模式3: desktop — Electron 桌面模式
// ============================================
function desktopMode() {
  console.log(colors.blue("🖥️  拾步桌面模式"));
  try {
    const electronPath = path.join(ROOT, "node_modules", ".bin", "electron");
    execSync(`"${electronPath}" "${path.join(ROOT, "electron", "main.js")}"`, {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch (err) {
    console.log(colors.red("Electron 未安装或出错"));
    console.log(colors.yellow("请安装: npm install electron --save-dev"));
  }
}

// ============================================
// 模式4: docker — Docker 运行
// ============================================
function dockerMode() {
  const action = process.argv[3] || "up";
  console.log(colors.blue(`🐳 Docker — ${action}`));

  const cmds = {
    up: "docker compose up -d",
    down: "docker compose down",
    build: "docker compose build",
    logs: "docker compose logs -f",
    restart: "docker compose restart",
    status: "docker compose ps",
  };

  const cmd = cmds[action];
  if (!cmd) {
    console.log(colors.red(`未知操作: ${action}`));
    console.log(colors.yellow(`可用: ${Object.keys(cmds).join(", ")}`));
    return;
  }

  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  if (action === "up") {
    console.log(colors.green(`✅ http://localhost:3000`));
  }
}

// ============================================
// 模式5: backup — 数据库备份
// ============================================
async function backupMode() {
  const dbPath = path.join(ROOT, "prisma", "dev.db");
  const backupDir = path.join(ROOT, "backups");

  if (!fs.existsSync(dbPath)) {
    console.log(colors.red("数据库文件不存在"));
    return;
  }

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `shibu-backup-${timestamp}.db`);

  fs.copyFileSync(dbPath, backupPath);
  console.log(colors.green(`✅ 数据库已备份: ${backupPath}`));

  // 清理旧备份（保留最近10个）
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith("shibu-backup-"))
    .sort()
    .reverse();

  if (files.length > 10) {
    files.slice(10).forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
    console.log(colors.yellow(`🧹 清理了 ${files.length - 10} 个旧备份`));
  }
}

// ============================================
// 帮助
// ============================================
function showHelp() {
  console.log(colors.bold("\n📋 拾步 OPC Tutor Suite — CLI"));
  console.log("用法: shibu <模式> [参数]\n");
  console.log(colors.bold("运行模式:"));
  console.log("  shibu server        启动 Web 服务（默认，自动打开浏览器）");
  console.log("  shibu desktop       启动 Electron 桌面应用");
  console.log("  shibu docker [op]   Docker 操作 (up/down/build/logs)");
  console.log("  shibu cli <cmd>     CLI 命令模式");
  console.log("");
  console.log(colors.bold("CLI 命令:"));
  console.log("  shibu cli report <姓名>   生成学生报告");
  console.log("  shibu cli health           健康检查");
  console.log("  shibu cli export <类型>   导出数据 (students/records/mistakes/scores)");
  console.log("  shibu cli backup           备份数据库");
  console.log("  shibu cli db <action>      数据库操作 (push/seed/studio)");
  console.log("");
  console.log(colors.bold("构建:"));
  console.log("  shibu build             构建生产版本");
  console.log("  shibu build:exe         打包为 Windows .exe");
  console.log("  shibu build:electron    打包 Electron 桌面应用");
  console.log("");
  console.log(colors.bold("示例:"));
  console.log("  shibu server");
  console.log("  shibu docker up");
  console.log("  shibu cli report 张三");
  console.log("  shibu cli backup\n");
}

// ============================================
// 主入口
// ============================================
async function main() {
  try {
    switch (MODE) {
      case "server":
      case "dev":
      case "start":
        await serverMode();
        break;
      case "cli":
        await cliMode();
        break;
      case "desktop":
      case "electron":
        desktopMode();
        break;
      case "docker":
        dockerMode();
        break;
      case "backup":
        await backupMode();
        break;
      case "build":
        execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
        break;
      case "build:exe":
        execSync(`node "${path.join(ROOT, "scripts", "build-exe.js")}"`, { cwd: ROOT, stdio: "inherit" });
        break;
      case "build:electron":
        execSync("npx electron-builder --win", { cwd: ROOT, stdio: "inherit" });
        break;
      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;
      default:
        console.log(colors.red(`未知模式: ${MODE}`));
        showHelp();
    }
  } catch (err) {
    console.error(colors.red(`错误: ${err.message}`));
    process.exit(1);
  }
}

main();
