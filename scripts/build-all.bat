@echo off
chcp 65001 >nul
title 拾步 - 全模式构建

echo ============================================
echo  拾步 · OPC Tutor Suite
echo  全模式构建工具
echo ============================================
echo.

:: 1. 安装依赖
echo 📦 [1/5] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 安装失败
    pause
    exit /b 1
)

:: 2. 生成 Prisma
echo 🗄️  [2/5] 生成数据库...
call npx prisma generate
call npx prisma db push
call npx prisma db seed

:: 3. 构建 Next.js
echo 🏗️  [3/5] 构建 Next.js...
set STANDALONE=true
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

:: 4. 构建 exe (Node.js SEA)
echo 📦 [4/5] 构建 Windows exe...
node scripts\build-exe.js

:: 5. 创建快捷方式
echo 🔗 [5/5] 创建快捷方式...
if not exist dist mkdir dist
copy NUL > dist\README.txt
echo 拾步 OPC Tutor Suite - 构建完成 > dist\README.txt
echo 构建时间: %date% %time% >> dist\README.txt

echo.
echo ============================================
echo  ✅ 全模式构建完成！
echo ============================================
echo.
echo 📂 输出目录:
echo    dist\shibu-tutor.exe   - Windows 单文件 exe
echo    .next\standalone\       - Next.js standalone
echo.
echo 🚀 运行方式:
echo    dist\shibu-tutor.exe    - 双击运行
echo    run server              - Node.js 模式
echo    docker compose up       - Docker 模式
echo.
pause
