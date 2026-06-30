@echo off
chcp 65001 >nul
title 拾步 - 构建 Windows exe

echo ============================================
echo  拾步 · OPC Tutor Suite
echo  Windows exe 构建工具
echo ============================================
echo.

:: 安装依赖
echo 📦 安装构建依赖...
call npm install -g postject 2>nul || echo postject 已存在

:: 执行构建
echo 🔨 开始构建...
node scripts\build-exe.js

if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo.
echo ✅ 构建完成！exe 位于 dist\ 目录
echo.
pause
