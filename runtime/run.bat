@echo off
chcp 65001 >nul
title 拾步 OPC Tutor Suite - 多模态运行器

if "%1"=="" (
    echo ============================================
    echo  拾步 · 多模态运行器
    echo ============================================
    echo.
    echo 用法: run ^<模式^> [参数]
    echo.
    echo 运行模式:
    echo   server        启动 Web 服务（默认）
    echo   dev           开发模式
    echo   env           显示运行环境信息
    echo   simulate      运行模拟场景
    echo   health        健康检查
    echo.
    echo 示例:
    echo   run server
    echo   run env
    echo   run simulate basic
    echo.
    goto end
)

node "%~dp0core_app.js" %*
:end
echo.
