#!/usr/bin/env node
// ============================================
// 多模态运行环境检测器
// 自动检测: exe / docker / dev / electron
// ============================================
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

function detectRuntimeMode() {
  // 1. 检测是否为 Electron
  if (process.versions && process.versions.electron) {
    return "electron";
  }

  // 2. 检测是否为 pkg/SEA 打包的 exe
  if (process.pkg || process.execPath.endsWith(".exe") && !process.execPath.includes("node")) {
    return "exe";
  }

  // 3. 检测是否为 Docker 容器
  if (process.env.DOCKER_CONTAINER === "true") {
    return "docker";
  }
  try {
    if (fs.existsSync("/.dockerenv")) return "docker";
    if (fs.existsSync("/proc/1/cgroup")) {
      const cgroup = fs.readFileSync("/proc/1/cgroup", "utf-8");
      if (cgroup.includes("docker") || cgroup.includes("kubepods")) return "docker";
    }
  } catch (_) {}

  // 4. 检测是否为开发模式
  if (process.env.NODE_ENV === "development" || process.argv.includes("dev")) {
    return "dev";
  }

  // 5. 默认: 生产 standalone 模式
  return "server";
}

function getRuntimeInfo() {
  const mode = detectRuntimeMode();
  return {
    mode,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    hostname: os.hostname(),
    cwd: process.cwd(),
    pid: process.pid,
    memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
    isPackaged: !!process.pkg,
    isDocker: mode === "docker",
    isElectron: mode === "electron",
    isExe: mode === "exe",
    timestamp: new Date().toISOString(),
  };
}

function getDataDir() {
  const mode = detectRuntimeMode();
  const home = os.homedir();

  switch (mode) {
    case "exe":
      // exe 模式: 数据目录在 exe 同级 data/
      return path.join(path.dirname(process.execPath), "data");
    case "electron":
      // Electron: 使用用户应用数据目录
      return path.join(home, ".shibu", "data");
    case "docker":
      // Docker: 使用 /app/data
      return "/app/data";
    default:
      // dev/server: 项目目录下的 data/
      return path.join(process.cwd(), "data");
  }
}

function ensureDataDir() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

module.exports = { detectRuntimeMode, getRuntimeInfo, getDataDir, ensureDataDir };
