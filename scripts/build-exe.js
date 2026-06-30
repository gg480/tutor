#!/usr/bin/env node
// ============================================
// 拾步 OPC Tutor Suite — 构建 Windows .exe
// Node.js SEA + pkg 双方案
// ============================================
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const EXE_NAME = "shibu-tutor.exe";

function log(m) { console.log(`[build] ${m}`); }
function ok(m) { console.log(`[ok] ${m}`); }

async function main() {
  console.log("\n=== 拾步 OPC Tutor Suite — 构建 Windows .exe ===\n");

  const nodeVer = process.version;
  const major = parseInt(nodeVer.slice(1).split(".")[0]);
  log(`Node.js ${nodeVer}`);

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  // 1. Build Next.js
  log("构建 Next.js...");
  execSync("npm run build", { cwd: ROOT, stdio: "inherit", env: { ...process.env, STANDALONE: "true" } });

  // 2. Generate Prisma
  log("生成 Prisma...");
  execSync("npx prisma generate", { cwd: ROOT, stdio: "inherit" });

  // 3. 复制资源到 dist/resources/
  const resDir = path.join(DIST, "resources");
  const dirs = [".next", "prisma", "public", "package.json", "next.config.mjs", ".env"];
  dirs.forEach((d) => {
    const src = path.join(ROOT, d);
    const dest = path.join(resDir, d);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  });
  ok("资源文件已复制");

  // 4. 创建启动脚本
  log("创建 SEA 启动脚本...");
  const wrapperPath = path.join(DIST, "sea-wrapper.js");
  const wrapperContent = `
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs2 = require("fs");
const ROOT = __dirname;
const PORT = 3000;
const URL = "http://localhost:" + PORT;
const serverPath = path.join(ROOT, "resources", ".next", "standalone", "server.js");
if (!fs2.existsSync(serverPath)) {
  console.error("Standalone server not found at:", serverPath);
  process.exit(1);
}
const env = { ...process.env, PORT: String(PORT), NODE_ENV: "production",
  NEXTAUTH_URL: URL, NEXTAUTH_SECRET: "shibu-sea-secret",
  DATABASE_URL: "file:" + path.join(ROOT, "data", "dev.db") };
const child = spawn(process.execPath, [serverPath], { env, stdio: "pipe" });
child.stdout.on("data", d => process.stdout.write(d));
child.stderr.on("data", d => process.stderr.write(d));
function wait(n) {
  if (n <= 0) { console.log("OK: " + URL); return; }
  http.get(URL + "/api/health", (res) => {
    if (res.statusCode === 200) {
      console.log("OK: " + URL);
      try { require("child_process").execSync("start " + URL, { shell: true }); } catch(e) {}
    }
  }).on("error", () => setTimeout(() => wait(n - 1), 1000));
}
wait(30);
process.on("SIGINT", () => { child.kill(); process.exit(0); });
process.on("SIGTERM", () => { child.kill(); process.exit(0); });
`;
  fs.writeFileSync(wrapperPath, wrapperContent.trim());

  // 5. SEA 构建
  if (major >= 20) {
    log("使用 Node.js SEA...");
    const configPath = path.join(DIST, "sea-config.json");
    fs.writeFileSync(configPath, JSON.stringify({
      main: wrapperPath.replace(/\\/g, "/"),
      output: path.join(DIST, "sea-prep.blob").replace(/\\/g, "/"),
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: true,
    }));

    execSync(`node --experimental-sea-config "${configPath}"`, { cwd: DIST, stdio: "inherit" });

    const targetExe = path.join(DIST, EXE_NAME);
    fs.copyFileSync(process.execPath, targetExe);

    try {
      execSync(
        `npx postject "${targetExe}" NODE_SEA_BLOB "${path.join(DIST, "sea-prep.blob")}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
        { cwd: DIST, stdio: "inherit" }
      );
      ok(`${EXE_NAME} 构建成功 (SEA)`);
    } catch (e) {
      log(`postject 失败: ${e.message}`);
      log("尝试 pkg 回退...");
      try {
        execSync(`npx pkg "${wrapperPath}" --targets node18-win-x64 --output "${path.join(DIST, EXE_NAME)}"`, { cwd: DIST, stdio: "inherit" });
        ok(`${EXE_NAME} 构建成功 (pkg)`);
      } catch (e2) {
        log(`pkg 也失败: ${e2.message}`);
        createLauncher();
      }
    }
  } else {
    log(`Node.js ${nodeVer} 不支持 SEA, 使用 pkg...`);
    try {
      execSync(`npx pkg "${wrapperPath}" --targets node18-win-x64 --output "${path.join(DIST, EXE_NAME)}"`, { cwd: DIST, stdio: "inherit" });
      ok(`${EXE_NAME} 构建成功 (pkg)`);
    } catch (e) {
      log(`pkg 失败: ${e.message}`);
      createLauncher();
    }
  }

  // 使用说明
  const info = [
    `拾步 OPC Tutor Suite — Windows 版`,
    `${"=".repeat(40)}`,
    `运行: ${EXE_NAME}`,
    `地址: http://localhost:3000`,
    `账号: admin@shibu.com / shibu123456`,
    `数据: ./data/dev.db`,
  ].join("\n");
  fs.writeFileSync(path.join(DIST, "使用说明.txt"), info);

  const stats = fs.existsSync(path.join(DIST, EXE_NAME)) ? fs.statSync(path.join(DIST, EXE_NAME)) : null;
  console.log(`\n✅ 构建完成! ${stats ? `大小: ${(stats.size / 1024 / 1024).toFixed(1)} MB` : ""}\n`);

  function createLauncher() {
    log("创建 BAT 启动器作为回退...");
    const batContent = `@echo off\r\nchcp 65001 >nul\r\ntitle 拾步 OPC Tutor Suite\r\nset PORT=3000\r\nset NODE_ENV=production\r\nnode "%~dp0resources\\node_modules\\next\\dist\\bin\\next" start -p 3000\r\npause\r\n`;
    fs.writeFileSync(path.join(DIST, "启动拾步.bat"), batContent);
    ok("启动器脚本已创建 (dist/启动拾步.bat)");
  }
}

main().catch((err) => { console.error(`❌ ${err.message}`); process.exit(1); });
