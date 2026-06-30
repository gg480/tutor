#!/bin/bash
# 拾步 OPC Tutor Suite — 一键安装与启动脚本
# 用法: bash setup.sh [dev|build|check]

set -e

ACTION="${1:-dev}"

echo "============================================"
echo "  拾步 · OPC Tutor Suite"
echo "  版本 0.1.0 · 45轮迭代"
echo "============================================"

case "$ACTION" in
  check)
    echo ""
    echo "🔍 系统检查..."
    echo ""

    # Node.js
    if command -v node &> /dev/null; then
      echo "✅ Node.js $(node --version)"
    else
      echo "❌ Node.js 未安装"
      exit 1
    fi

    # npm
    if command -v npm &> /dev/null; then
      echo "✅ npm $(npm --version)"
    else
      echo "❌ npm 未安装"
      exit 1
    fi

    # node_modules
    if [ -d "node_modules" ]; then
      echo "✅ node_modules 已安装"
    else
      echo "⚠️  node_modules 未安装，运行: npm install"
    fi

    # 数据库
    if [ -f "prisma/dev.db" ]; then
      echo "✅ 数据库文件存在"
    else
      echo "⚠️  数据库文件不存在，将在安装时创建"
    fi

    echo ""
    echo "系统检查完成"
    ;;

  dev)
    echo ""
    echo "📦 第1步：安装依赖..."
    npm install

    echo ""
    echo "🗄️  第2步：生成 Prisma Client..."
    npx prisma generate

    echo ""
    echo "🗄️  第3步：初始化数据库..."
    npx prisma db push

    echo ""
    echo "🌱 第4步：填充初始数据..."
    npx prisma db seed

    echo ""
    echo "✅ 安装完成！"
    echo ""
    echo "启动开发服务器："
    echo "  npm run dev"
    echo ""
    echo "默认管理员账号："
    echo "  邮箱: admin@shibu.com"
    echo "  密码: shibu123456"
    echo ""
    echo "健康检查: http://localhost:3000/api/health"
    echo "品牌主页: http://localhost:3000/studio"
    echo ""

    # 启动
    echo "🚀 启动开发服务器..."
    npm run dev
    ;;

  build)
    echo ""
    echo "🏗️  构建生产版本..."
    npm run build
    echo ""
    echo "✅ 构建完成！"
    echo "启动: npm start"
    ;;

  test)
    echo ""
    echo "🧪 运行 Playwright 测试..."
    npx playwright test --reporter=list
    ;;

  *)
    echo "用法: bash setup.sh [dev|build|check|test]"
    echo ""
    echo "  dev   一键安装并启动（默认）"
    echo "  build 构建生产版本"
    echo "  check 检查系统依赖"
    echo "  test  运行测试"
    ;;
esac
