@echo off
chcp 65001 >nul
title 拾步 - 业务模拟器

echo ============================================
echo  拾步 · 业务模拟器
echo  自动模拟完整业务流程
echo ============================================
echo.

:: 确保服务在运行
echo 📡 检查服务状态...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 服务未运行，请先启动: run server
    pause
    exit /b 1
)

echo ✅ 服务已就绪
echo.

:: 运行模拟
echo 🔄 开始模拟业务流程...
node "%~dp0core_app.js" simulate full

echo.
echo ✅ 模拟完成
pause
