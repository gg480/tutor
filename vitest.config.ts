import { defineConfig } from "vitest/config";
import path from "node:path";

// 集中配置 vitest：解析 @ 别名 + 限定测试目录
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/app/api/courses/**/*.ts",
        "src/app/api/mistakes/**/*.ts",
      ],
    },
  },
});
