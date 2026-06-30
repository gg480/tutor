#!/usr/bin/env node
// 修复 Bash 沙箱 EEXIST 错误
// 问题: C:\ClaudeState\...\tasks 本应是目录，但可能是文件导致 mkdir 失败

const fs = require("fs");
const path = require("path");

const TASKS_PATH = "C:\\ClaudeState\\D--02--------\\d58edfa4-9482-4590-9df7-0da6684aa5ec\\tasks";

try {
  const stat = fs.statSync(TASKS_PATH);
  if (stat.isFile()) {
    console.log(`[fix] tasks 是文件，大小为 ${stat.size} 字节，正在删除...`);
    fs.unlinkSync(TASKS_PATH);
    console.log("[fix] ✅ 已删除文件，请重新运行 bash 命令");
  } else if (stat.isDirectory()) {
    console.log("[fix] tasks 已是目录，无冲突");
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("[fix] tasks 路径不存在，无冲突");
  } else {
    console.log(`[fix] 错误: ${err.message}`);
  }
}
