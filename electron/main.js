// ============================================
// 拾步 OPC Tutor Suite — Electron 桌面主进程
// 业界标准 Electron + Next.js 打包方案
// ============================================
const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, Notification } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow = null;
let tray = null;
let serverProcess = null;
const PORT = 3080; // 避开常见端口冲突
const SERVER_URL = `http://localhost:${PORT}`;

// ---- 启动 Next.js 服务 ----
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(process.resourcesPath || __dirname, "..", ".next", "standalone", "server.js");

    // 开发环境回退
    const devServerPath = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");

    const env = {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      NEXTAUTH_URL: SERVER_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "shibu-electron-secret",
      DATABASE_URL: `file:${path.join(app.getPath("userData"), "data", "dev.db")}`,
    };

    // 尝试启动 standalone 服务
    const child = spawn("node", [serverPath], { env, stdio: ["pipe", "pipe", "pipe"] });

    child.stdout.on("data", (d) => console.log(`[server] ${d}`));
    child.stderr.on("data", (d) => console.error(`[server] ${d}`));

    child.on("error", (err) => {
      console.error("Standalone 启动失败，回退到 dev server:", err.message);
      // 回退: npx next start
      const dev = spawn("npx", ["next", "start", "-p", String(PORT)], {
        env,
        stdio: "pipe",
        shell: true,
      });
      dev.stdout.on("data", (d) => console.log(`[dev-server] ${d}`));
      dev.stderr.on("data", (d) => console.error(`[dev-server] ${d}`));
      serverProcess = dev;
      waitForServer().then(resolve).catch(reject);
    });

    serverProcess = child;
    waitForServer().then(resolve).catch(reject);
  });
}

function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get(`${SERVER_URL}/api/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else if (n > 0) setTimeout(() => check(n - 1), 1000);
        else reject(new Error("服务启动超时"));
      }).on("error", () => {
        if (n > 0) setTimeout(() => check(n - 1), 1000);
        else reject(new Error("服务启动超时"));
      });
    };
    check(retries);
  });
}

// ---- 创建主窗口 ----
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "拾步 · OPC Tutor Suite",
    icon: path.join(__dirname, "..", "public", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(SERVER_URL);
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // 开发者工具 (生产环境可注释掉)
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (process.platform !== "darwin") app.quit();
  });

  // 设置窗口标题跟随页面
  mainWindow.webContents.on("page-title-updated", (e, title) => {
    e.preventDefault();
    mainWindow.setTitle(`拾步 · ${title}`);
  });
}

// ---- 系统托盘 ----
function createTray() {
  const iconPath = path.join(__dirname, "..", "public", "tray-icon.png");
  try {
    tray = new Tray(nativeImage.createFromPath(iconPath));
  } catch {
    // 无图标文件时跳过
    return;
  }

  tray.setToolTip("拾步 OPC Tutor Suite");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "打开主界面", click: () => mainWindow?.show() },
    { label: "后台运行", type: "radio", checked: true },
    { type: "separator" },
    {
      label: "退出", click: () => {
        const notif = new Notification({ title: "拾步", body: "正在关闭服务..." });
        notif.show();
        app.quit();
      },
    },
  ]));

  tray.on("double-click", () => mainWindow?.show());
}

// ---- 应用生命周期 ----
app.whenReady().then(async () => {
  // 启动通知
  const startupNotif = new Notification({
    title: "拾步 · OPC Tutor Suite",
    body: "正在启动服务，请稍候...",
  });
  startupNotif.show();

  try {
    await startServer();
    console.log("✅ 服务启动成功");
  } catch (err) {
    dialog.showErrorBox("启动失败", `无法启动服务: ${err.message}`);
    app.quit();
    return;
  }

  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
});
