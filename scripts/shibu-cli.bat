@echo off
chcp 65001 >nul
title 拾步 OPC Tutor Suite

echo ============================================
echo  拾步 · OPC Tutor Suite CLI
echo ============================================
echo.

if "%1"=="dev" goto dev
if "%1"=="build" goto build
if "%1"=="start" goto start
if "%1"=="docker" goto docker
if "%1"=="test" goto test
if "%1"=="db-push" goto dbpush
if "%1"=="db-seed" goto dbseed
if "%1"=="help" goto help
if "%1"=="" goto dev

echo 未知命令: %1
goto help

:dev
echo 🚀 启动开发服务器...
call npx prisma generate
call npx prisma db push
npm run dev
goto end

:build
echo 📦 构建生产版本...
call npm run build
echo ✅ 构建完成！
goto end

:start
echo 🚀 启动生产服务器...
call npx prisma generate
call npx prisma db push
npm start
goto end

:docker
echo 🐳 构建并启动 Docker 容器...
docker compose build
docker compose up -d
echo ✅ Docker 容器已启动: http://localhost:3000
goto end

:test
echo 🧪 运行 Playwright 测试...
npx playwright test --reporter=list
goto end

:dbpush
echo 🗄️  同步数据库...
call npx prisma generate
call npx prisma db push
goto end

:dbseed
echo 🌱 填充种子数据...
call npx prisma db seed
goto end

:help
echo 用法: shibu-cli [命令]
echo.
echo 可用命令:
echo   dev        启动开发服务器（默认）
echo   build      构建生产版本
echo   start      启动生产服务器
echo   docker     构建并启动 Docker
echo   test       运行 Playwright 测试
echo   db-push    同步数据库
echo   db-seed    填充种子数据
echo   help       显示帮助
echo.
echo 示例:
echo   shibu-cli dev
echo   shibu-cli docker
echo   shibu-cli test
goto end

:end
echo.
