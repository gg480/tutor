#!/bin/bash
# 拾步 OPC Tutor Suite CLI
# 用法: ./shibu-cli.sh [command]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

case "${1:-dev}" in
  dev)
    echo -e "${BLUE}🚀 启动开发服务器...${NC}"
    npx prisma generate
    npx prisma db push
    npm run dev
    ;;
  build)
    echo -e "${BLUE}📦 构建生产版本...${NC}"
    npm run build
    echo -e "${GREEN}✅ 构建完成！${NC}"
    ;;
  start)
    echo -e "${BLUE}🚀 启动生产服务器...${NC}"
    npx prisma generate
    npx prisma db push
    npm start
    ;;
  docker)
    echo -e "${BLUE}🐳 构建并启动 Docker...${NC}"
    docker compose build
    docker compose up -d
    echo -e "${GREEN}✅ http://localhost:3000${NC}"
    ;;
  docker:stop)
    docker compose down
    ;;
  test)
    echo -e "${BLUE}🧪 运行测试...${NC}"
    npx playwright test --reporter=list
    ;;
  db:push)
    npx prisma generate && npx prisma db push
    ;;
  db:seed)
    npx prisma db seed
    ;;
  db:studio)
    npx prisma studio
    ;;
  health)
    curl -s http://localhost:3000/api/health | python3 -m json.tool
    ;;
  help|*)
    echo "用法: ./shibu-cli.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  dev          启动开发服务器（默认）"
    echo "  build        构建生产版本"
    echo "  start        启动生产服务器"
    echo "  docker       构建并启动 Docker"
    echo "  docker:stop  停止 Docker"
    echo "  test         运行测试"
    echo "  db:push      同步数据库"
    echo "  db:seed      填充种子数据"
    echo "  db:studio    打开数据库管理"
    echo "  health       健康检查"
    ;;
esac
